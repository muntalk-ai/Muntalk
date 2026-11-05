// lib/exchangeCall.ts
// ─────────────────────────────────────────────────────────────────────────────
// MunTalk Exchange 1:1 voice call (audio-only WebRTC, Firestore signaling).
// No video, no group calls, no tutor flows.
//
// Signaling collection: `exchange_calls/{callId}`
//   callerId, calleeId, members [callerId, calleeId],
//   status: 'ringing' | 'active' | 'ended' | 'declined',
//   offer / answer: RTCSessionDescriptionInit objects stored as-is,
//   createdAt / endedAt: server timestamps.
// ICE candidates live in subcollections (no array-union races):
//   exchange_calls/{callId}/callerCandidates/{autoId}
//   exchange_calls/{callId}/calleeCandidates/{autoId}
//   each doc: { candidate, sdpMid, sdpMLineIndex, createdAt }
//
// ICE servers: STUN only by default. Set these env vars to add TURN:
//   NEXT_PUBLIC_TURN_URLS       (comma-separated TURN URLs)
//   NEXT_PUBLIC_TURN_USERNAME
//   NEXT_PUBLIC_TURN_CREDENTIAL
// ─────────────────────────────────────────────────────────────────────────────

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export type CallStatus = 'ringing' | 'active' | 'ended' | 'declined';

export interface ExchangeCallDoc {
  id: string;
  callerId: string;
  calleeId: string;
  members: string[];
  status: CallStatus;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt?: unknown;
  endedAt?: unknown;
}

export type ConnectionState = 'new' | 'connecting' | 'connected' | 'failed' | 'closed';

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
  const urls = (process.env.NEXT_PUBLIC_TURN_URLS || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  const username = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const credential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
  if (urls.length > 0 && username && credential) {
    servers.push({ urls, username, credential });
  }
  return servers;
}

function callDocToExchangeCall(id: string, data: Record<string, unknown>): ExchangeCallDoc {
  return {
    id,
    callerId: typeof data.callerId === 'string' ? data.callerId : '',
    calleeId: typeof data.calleeId === 'string' ? data.calleeId : '',
    members: Array.isArray(data.members) ? data.members.filter((m): m is string => typeof m === 'string') : [],
    status: (data.status as CallStatus) || 'ringing',
    offer: data.offer as RTCSessionDescriptionInit | undefined,
    answer: data.answer as RTCSessionDescriptionInit | undefined,
    createdAt: data.createdAt,
    endedAt: data.endedAt,
  };
}

/** Create a ringing call doc. Returns the new call id. */
export async function createCallDoc(callerId: string, calleeId: string): Promise<string> {
  const ref = await addDoc(collection(db, 'exchange_calls'), {
    callerId,
    calleeId,
    members: [callerId, calleeId],
    status: 'ringing',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Callee declines: ringing -> declined. Caller sees this and cleans up. */
export async function declineCall(callId: string): Promise<void> {
  await updateDoc(doc(db, 'exchange_calls', callId), { status: 'declined', endedAt: serverTimestamp() });
}

/** Either side ends the call: -> ended. Best-effort; failures are swallowed
 *  (e.g. the other side already ended it). */
export async function endCallDoc(callId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'exchange_calls', callId), { status: 'ended', endedAt: serverTimestamp() });
  } catch {
    // Already ended / deleted — nothing left to do.
  }
}

/**
 * Listen for calls ringing for `uid`. Single-field array-contains query, so
 * no composite index is needed; ringing/callee filtering happens client-side.
 * The callback receives the current list of ringing calls for this user.
 */
export function listenIncomingCalls(uid: string, onRinging: (calls: ExchangeCallDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'exchange_calls'), where('members', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const ringing = snap.docs
      .map((d) => callDocToExchangeCall(d.id, d.data()))
      .filter((c) => c.status === 'ringing' && c.calleeId === uid);
    onRinging(ringing);
  });
}

export interface VoiceCallSessionCallbacks {
  /** Remote audio track arrived — attach to an <audio> element. */
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionState: (state: ConnectionState) => void;
  /** The call doc changed status (answer arrived, declined, ended). */
  onCallStatus: (status: CallStatus, call: ExchangeCallDoc) => void;
}

/**
 * One live call session: owns the RTCPeerConnection, the local mic stream,
 * the call-doc listener and both candidate subcollection listeners.
 * dispose() cleans up locally WITHOUT writing to Firestore (used when the
 * remote side already ended/declined). hangup() writes `ended` first, then
 * cleans up (used when the local user ends the call).
 */
export class VoiceCallSession {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private unsubscribers: Unsubscribe[] = [];
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private disposed = false;

  constructor(
    private callId: string,
    private localUid: string,
    private isCaller: boolean,
    private cb: VoiceCallSessionCallbacks
  ) {}

  private async getMic(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false,
    });
  }

  private buildPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: getIceServers() });
    const myCandidates = this.isCaller ? 'callerCandidates' : 'calleeCandidates';
    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      // Fire-and-forget: a failed candidate write must not break the call.
      addDoc(collection(db, 'exchange_calls', this.callId, myCandidates), {
        candidate: ev.candidate.candidate,
        sdpMid: ev.candidate.sdpMid,
        sdpMLineIndex: ev.candidate.sdpMLineIndex,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    };
    pc.ontrack = (ev) => {
      if (ev.streams[0]) {
        this.remoteStream = ev.streams[0];
        this.cb.onRemoteStream(ev.streams[0]);
      }
    };
    pc.onconnectionstatechange = () => {
      this.cb.onConnectionState(pc.connectionState as ConnectionState);
    };
    return pc;
  }

  private listenRemoteCandidates(): void {
    const remoteCandidates = this.isCaller ? 'calleeCandidates' : 'callerCandidates';
    const seen = new Set<string>();
    const unsub = onSnapshot(collection(db, 'exchange_calls', this.callId, remoteCandidates), (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type !== 'added' || seen.has(change.doc.id)) continue;
        seen.add(change.doc.id);
        const d = change.doc.data();
        if (typeof d.candidate !== 'string') continue;
        const init: RTCIceCandidateInit = {
          candidate: d.candidate,
          sdpMid: typeof d.sdpMid === 'string' ? d.sdpMid : null,
          sdpMLineIndex: typeof d.sdpMLineIndex === 'number' ? d.sdpMLineIndex : null,
        };
        void this.addRemoteCandidate(init);
      }
    });
    this.unsubscribers.push(unsub);
  }

  private async addRemoteCandidate(init: RTCIceCandidateInit): Promise<void> {
    const pc = this.pc;
    if (!pc || this.disposed) return;
    // Candidates arriving before the remote description must wait — adding
    // them early throws and the candidate is lost.
    if (!pc.remoteDescription) {
      this.pendingCandidates.push(init);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(init));
    } catch {
      // Stale candidate for a closing connection — safe to drop.
    }
  }

  private async flushPendingCandidates(): Promise<void> {
    const queued = this.pendingCandidates;
    this.pendingCandidates = [];
    for (const init of queued) await this.addRemoteCandidate(init);
  }

  private listenCallDoc(): void {
    const unsub = onSnapshot(doc(db, 'exchange_calls', this.callId), (snap) => {
      if (!snap.exists() || this.disposed) return;
      const call = callDocToExchangeCall(snap.id, snap.data());
      if (this.isCaller && call.answer && this.pc && !this.pc.remoteDescription) {
        // Callee answered: apply the answer, then flush queued candidates.
        void this.pc
          .setRemoteDescription(new RTCSessionDescription(call.answer))
          .then(() => this.flushPendingCandidates())
          .catch(() => {});
      }
      this.cb.onCallStatus(call.status, call);
    });
    this.unsubscribers.push(unsub);
  }

  /** Caller: mic -> offer -> write offer to the call doc -> wait for answer. */
  async startAsCaller(): Promise<void> {
    this.localStream = await this.getMic();
    this.pc = this.buildPeerConnection();
    for (const track of this.localStream.getTracks()) this.pc.addTrack(track, this.localStream);
    this.listenCallDoc();
    this.listenRemoteCandidates();
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await updateDoc(doc(db, 'exchange_calls', this.callId), { offer: { type: offer.type, sdp: offer.sdp } });
  }

  /** Callee: mic -> apply offer -> answer -> write answer + status active. */
  async acceptAsCallee(offer: RTCSessionDescriptionInit): Promise<void> {
    this.localStream = await this.getMic();
    this.pc = this.buildPeerConnection();
    for (const track of this.localStream.getTracks()) this.pc.addTrack(track, this.localStream);
    this.listenCallDoc();
    this.listenRemoteCandidates();
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    await this.flushPendingCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await updateDoc(doc(db, 'exchange_calls', this.callId), {
      answer: { type: answer.type, sdp: answer.sdp },
      status: 'active',
    });
  }

  /** Toggle the local mic. Returns the new muted state. */
  toggleMute(): boolean {
    if (!this.localStream) return false;
    const enabled = this.localStream.getAudioTracks().some((t) => t.enabled);
    const nextMuted = enabled; // tracks are on -> muting turns them off
    for (const track of this.localStream.getAudioTracks()) track.enabled = !nextMuted;
    return nextMuted;
  }

  get muted(): boolean {
    if (!this.localStream) return false;
    return !this.localStream.getAudioTracks().some((t) => t.enabled);
  }

  /** Local user ends the call: mark the doc ended, then clean up locally. */
  async hangup(): Promise<void> {
    await endCallDoc(this.callId);
    this.dispose();
  }

  /** Local-only cleanup: stop mic tracks, close the connection, unsubscribe. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const unsub of this.unsubscribers) {
      try {
        unsub();
      } catch {
        // Ignore unsubscribe errors during teardown.
      }
    }
    this.unsubscribers = [];
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) track.stop();
      this.localStream = null;
    }
    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        // Ignore close errors during teardown.
      }
      this.pc = null;
    }
    this.remoteStream = null;
    this.pendingCandidates = [];
  }
}
