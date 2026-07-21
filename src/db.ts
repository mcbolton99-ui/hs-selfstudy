/**
 * Hanseo High School Study Room Seat Reservation System - Database Service
 * 
 * Supports two modes:
 * 1. Supabase Mode: Active when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are provided.
 * 2. LocalStorage Mode (Fallback): Active by default or when API keys are missing.
 * 
 * --- SUPABASE SQL SCHEMA FOR COPIED PASTING ---
 * 
 * -- 1. Create students table
 * create table students (
 *   id text primary key,
 *   password text not null
 * );
 * 
 * -- 2. Create reservations table
 * create table reservations (
 *   seat_id integer primary key,
 *   student_id text references students(id) on delete set null,
 *   reserved_at text
 * );
 * 
 * -- 3. Create room_config table
 * create table room_config (
 *   id integer primary key default 1,
 *   num_rows integer not null default 6,
 *   num_cols integer not null default 5,
 *   constraint single_row check (id = 1)
 * );
 * 
 * -- Seed initial default students
 * insert into students (id, password) values
 *   ('admin', 'admin123'),
 *   ('student1', '1234'),
 *   ('student2', '1234'),
 *   ('student3', '1234')
 * on conflict (id) do nothing;
 * 
 * -- Seed initial reservations (30 seats)
 * insert into reservations (seat_id, student_id, reserved_at)
 * select s, null, null from generate_series(1, 30) s
 * on conflict (seat_id) do nothing;
 * 
 * -- Seed initial config
 * insert into room_config (id, num_rows, num_cols) values (1, 6, 5)
 * on conflict (id) do nothing;
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Student {
  id: string;
  password?: string;
}

export interface Reservation {
  seat_id: number;
  student_id: string | null;
  reserved_at: string | null;
}

export interface RoomConfig {
  num_rows: number;
  num_cols: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client initialized successfully!");
  } catch (err) {
    console.error("Failed to initialize Supabase client, falling back to LocalStorage:", err);
  }
} else {
  console.log("Supabase API keys not detected. Running in robust LocalStorage Fallback Mode.");
}

// ============================================================================
// LOCAL STORAGE ENGINE (FALLBACK & SEED DATA)
// ============================================================================

const SEED_STUDENTS: Student[] = [
  { id: 'admin', password: 'admin123' },
  { id: '30317', password: '1234' },
  { id: '30318', password: '1234' },
  { id: '30319', password: '1234' },
];

const DEFAULT_ROWS = 6;
const DEFAULT_COLS = 5;

function getLocalStudents(): Student[] {
  const data = localStorage.getItem('hanseo_students');
  if (!data) {
    localStorage.setItem('hanseo_students', JSON.stringify(SEED_STUDENTS));
    return SEED_STUDENTS;
  }
  return JSON.parse(data);
}

function saveLocalStudents(students: Student[]) {
  localStorage.setItem('hanseo_students', JSON.stringify(students));
}

function getLocalConfig(): RoomConfig {
  const data = localStorage.getItem('hanseo_config');
  if (!data) {
    const config = { num_rows: DEFAULT_ROWS, num_cols: DEFAULT_COLS };
    localStorage.setItem('hanseo_config', JSON.stringify(config));
    return config;
  }
  return JSON.parse(data);
}

function saveLocalConfig(config: RoomConfig) {
  localStorage.setItem('hanseo_config', JSON.stringify(config));
}

function getLocalReservations(): Reservation[] {
  const data = localStorage.getItem('hanseo_reservations');
  const config = getLocalConfig();
  const totalSeats = config.num_rows * config.num_cols;

  if (!data) {
    const reservations: Reservation[] = [];
    for (let i = 1; i <= totalSeats; i++) {
      reservations.push({ seat_id: i, student_id: null, reserved_at: null });
    }
    // Seed some mock usage for demonstration
    reservations[4] = { seat_id: 5, student_id: '30317', reserved_at: new Date(Date.now() - 3600000).toISOString() };
    reservations[11] = { seat_id: 12, student_id: '30318', reserved_at: new Date(Date.now() - 7200000).toISOString() };

    localStorage.setItem('hanseo_reservations', JSON.stringify(reservations));
    return reservations;
  }

  let list: Reservation[] = JSON.parse(data);
  // Ensure list has exactly totalSeats, adjust size if needed
  if (list.length < totalSeats) {
    const newList = [...list];
    for (let i = list.length + 1; i <= totalSeats; i++) {
      newList.push({ seat_id: i, student_id: null, reserved_at: null });
    }
    localStorage.setItem('hanseo_reservations', JSON.stringify(newList));
    return newList;
  } else if (list.length > totalSeats) {
    const newList = list.slice(0, totalSeats);
    localStorage.setItem('hanseo_reservations', JSON.stringify(newList));
    return newList;
  }
  return list;
}

function saveLocalReservations(reservations: Reservation[]) {
  localStorage.setItem('hanseo_reservations', JSON.stringify(reservations));
}

// ============================================================================
// CORE SERVICE API (HYBRID SUPABASE + LOCALSTORAGE)
// ============================================================================

export const dbService = {
  // 1. Config management
  async getConfig(): Promise<RoomConfig> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('room_config')
          .select('num_rows, num_cols')
          .eq('id', 1)
          .single();
        if (error) throw error;
        if (data) return { num_rows: data.num_rows, num_cols: data.num_cols };
      } catch (err) {
        console.error("Supabase getConfig failed, using localStorage:", err);
      }
    }
    return getLocalConfig();
  },

  async updateConfig(rows: number, cols: number): Promise<RoomConfig> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('room_config')
          .upsert({ id: 1, num_rows: rows, num_cols: cols })
          .select()
          .single();
        if (error) throw error;
        // In Supabase, if the reservation table is populated, adjust reservations matching new rows*cols
        const totalSeats = rows * cols;
        const { data: resData } = await supabase.from('reservations').select('seat_id');
        const existingCount = resData ? resData.length : 0;
        if (existingCount < totalSeats) {
          // Add missing seats
          const newSeats = [];
          for (let i = existingCount + 1; i <= totalSeats; i++) {
            newSeats.push({ seat_id: i, student_id: null, reserved_at: null });
          }
          await supabase.from('reservations').insert(newSeats);
        } else if (existingCount > totalSeats) {
          // Remove extra seats
          await supabase.from('reservations').delete().gt('seat_id', totalSeats);
        }
        return { num_rows: rows, num_cols: cols };
      } catch (err) {
        console.error("Supabase updateConfig failed, using localStorage:", err);
      }
    }
    const config = { num_rows: rows, num_cols: cols };
    saveLocalConfig(config);
    // Align reservations count to match rows * cols
    getLocalReservations(); 
    return config;
  },

  // 2. Student Authentication & Password Changes
  async getStudent(id: string): Promise<Student | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          if (error.code === 'PGRST116') return null; // Not found
          throw error;
        }
        return data;
      } catch (err) {
        console.error("Supabase getStudent failed, using localStorage:", err);
      }
    }
    const list = getLocalStudents();
    return list.find(s => s.id === id) || null;
  },

  async getAllStudents(): Promise<Student[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Supabase getAllStudents failed, using localStorage:", err);
      }
    }
    return getLocalStudents();
  },

  async addStudent(student: Student): Promise<Student> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .insert({ id: student.id, password: student.password })
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Supabase addStudent failed, using localStorage:", err);
      }
    }
    const list = getLocalStudents();
    if (list.some(s => s.id === student.id)) {
      throw new Error("이미 존재하는 아이디입니다.");
    }
    list.push(student);
    saveLocalStudents(list);
    return student;
  },

  async updateStudent(student: Student): Promise<Student> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .update({ password: student.password })
          .eq('id', student.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Supabase updateStudent failed, using localStorage:", err);
      }
    }
    const list = getLocalStudents();
    const index = list.findIndex(s => s.id === student.id);
    if (index !== -1) {
      list[index].password = student.password;
      saveLocalStudents(list);
    }
    return student;
  },

  async deleteStudent(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Supabase deleteStudent failed, using localStorage:", err);
      }
    }
    const list = getLocalStudents();
    const filtered = list.filter(s => s.id !== id);
    if (filtered.length !== list.length) {
      saveLocalStudents(filtered);
      return true;
    }
    return false;
  },

  // 3. Reservations (Desks)
  async getReservations(): Promise<Reservation[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .order('seat_id', { ascending: true });
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.error("Supabase getReservations failed, using localStorage:", err);
      }
    }
    return getLocalReservations();
  },

  async reserveSeat(seatId: number, studentId: string): Promise<Reservation> {
    const timestamp = new Date().toISOString();
    if (supabase) {
      try {
        // Double check first if the student already has another seat reserved and release it
        const { data: activeRes } = await supabase
          .from('reservations')
          .select('seat_id')
          .eq('student_id', studentId);
        
        if (activeRes && activeRes.length > 0) {
          // Release previous seat(s)
          const seatIdsToRelease = activeRes.map(r => r.seat_id);
          await supabase
            .from('reservations')
            .update({ student_id: null, reserved_at: null })
            .in('seat_id', seatIdsToRelease);
        }

        const { data, error } = await supabase
          .from('reservations')
          .update({ student_id: studentId, reserved_at: timestamp })
          .eq('seat_id', seatId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Supabase reserveSeat failed, using localStorage:", err);
      }
    }
    
    // LocalStorage reserve logic
    const reservations = getLocalReservations();
    // Release student's previous seat if any
    reservations.forEach(r => {
      if (r.student_id === studentId) {
        r.student_id = null;
        r.reserved_at = null;
      }
    });
    
    const target = reservations.find(r => r.seat_id === seatId);
    if (target) {
      target.student_id = studentId;
      target.reserved_at = timestamp;
    }
    saveLocalReservations(reservations);
    return { seat_id: seatId, student_id: studentId, reserved_at: timestamp };
  },

  async releaseSeat(seatId: number): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('reservations')
          .update({ student_id: null, reserved_at: null })
          .eq('seat_id', seatId);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Supabase releaseSeat failed, using localStorage:", err);
      }
    }
    
    // LocalStorage release logic
    const reservations = getLocalReservations();
    const target = reservations.find(r => r.seat_id === seatId);
    if (target) {
      target.student_id = null;
      target.reserved_at = null;
      saveLocalReservations(reservations);
      return true;
    }
    return false;
  }
};
