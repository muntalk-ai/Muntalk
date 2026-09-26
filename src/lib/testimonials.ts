// lib/testimonials.ts — learner testimonials (social proof)
// Flow: lesson page prompts users at 10 completed lessons → stored in Firestore
// → shown on the landing (LevelHub) once enough approved testimonials exist.
import { db } from './firebase';
import {
  collection, addDoc, getDocs, query,
  orderBy, limit, serverTimestamp, Timestamp,
} from 'firebase/firestore';

export interface Testimonial {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt: Timestamp | null;
  approved: boolean;
}

/** Minimum approved testimonials before the landing section appears. */
export const MIN_TESTIMONIALS = 3;
export const MAX_TESTIMONIAL_TEXT = 200;

const col = () => collection(db, 'testimonials');

export async function submitTestimonial(uid: string, displayName: string, text: string): Promise<void> {
  const clean = text.trim().slice(0, MAX_TESTIMONIAL_TEXT);
  if (!clean) throw new Error('empty');
  await addDoc(col(), {
    uid,
    displayName: (displayName || 'Learner').slice(0, 40),
    text: clean,
    createdAt: serverTimestamp(),
    approved: true,
  });
}

/** Newest approved testimonials (client-side approved filter avoids composite index). */
export async function getTestimonials(max = 6): Promise<Testimonial[]> {
  const q = query(col(), orderBy('createdAt', 'desc'), limit(max * 2));
  const snap = await getDocs(q);
  const out: Testimonial[] = [];
  snap.forEach(d => {
    const data = d.data() as Omit<Testimonial, 'id'>;
    if (data.approved !== false && data.text) {
      out.push({ ...data, id: d.id });
      if (out.length >= max) return;
    }
  });
  return out.slice(0, max);
}
