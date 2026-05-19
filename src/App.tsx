/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Calculator, 
  Languages, 
  Search, 
  Plus, 
  Trash2, 
  Save, 
  TrendingUp,
  RotateCcw,
  CloudUpload,
  CloudOff,
  Loader2,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import type { Session } from '@supabase/supabase-js';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Student {
  id: string;
  name: string;
  math: number;
  language: number;
  birth_year: number;
  foto_jugador?: string | null;
  created_at?: string;
}

// --- Initial Data (Fallback) ---
const INITIAL_STUDENTS: Student[] = [
  { id: '1', name: 'Alba García', math: 8.5, language: 7.2, birth_year: 2012, foto_jugador: null },
  { id: '2', name: 'Bernat Soler', math: 4.5, language: 6.8, birth_year: 2012, foto_jugador: null },
  { id: '3', name: 'Carla Martínez', math: 9.0, language: 9.5, birth_year: 2011, foto_jugador: null },
  { id: '4', name: 'David Ferrer', math: 6.2, language: 5.5, birth_year: 2012, foto_jugador: null },
  { id: '5', name: 'Elena Ruiz', math: 7.8, language: 8.4, birth_year: 2012, foto_jugador: null },
  { id: '6', name: 'Fernando López', math: 3.5, language: 4.2, birth_year: 2013, foto_jugador: null },
  { id: '7', name: 'Gema Pons', math: 8.0, language: 7.5, birth_year: 2012, foto_jugador: null },
  { id: '8', name: 'Hugo Navarro', math: 5.5, language: 6.0, birth_year: 2012, foto_jugador: null },
  { id: '9', name: 'Irene Bosch', math: 9.5, language: 8.8, birth_year: 2011, foto_jugador: null },
  { id: '10', name: 'Jorge Castro', math: 2.0, language: 3.5, birth_year: 2012, foto_jugador: null },
];

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchStudents();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchStudents();
      } else {
        setStudents([]);
        setLoading(false);
      }
    });

    const checkConfig = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    setIsSupabaseConfigured(checkConfig);
    
    if (!checkConfig) {
      setStudents(INITIAL_STUDENTS);
      setLoading(false);
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStudents(data);
      } else {
        // If DB is empty, initialize with mock data if user wants
        setStudents(INITIAL_STUDENTS);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents(INITIAL_STUDENTS);
    } finally {
      setLoading(false);
    }
  };

  // --- Statistics ---
  const stats = useMemo(() => {
    if (students.length === 0) return { mathAvg: '0.0', langAvg: '0.0', overallAvg: '0.0', passRate: '0' };
    
    const mathSum = students.reduce((acc, s) => acc + s.math, 0);
    const langSum = students.reduce((acc, s) => acc + s.language, 0);
    const passes = students.filter(s => s.math >= 5 && s.language >= 5).length;
    
    return {
      mathAvg: (mathSum / students.length).toFixed(1),
      langAvg: (langSum / students.length).toFixed(1),
      overallAvg: ((mathSum + langSum) / (students.length * 2)).toFixed(2),
      passRate: ((passes / students.length) * 100).toFixed(0)
    };
  }, [students]);

  // --- Handlers ---
  const updateGrade = async (id: string, subject: 'math' | 'language', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 10) return;
    
    // Optimistic update
    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, [subject]: num } : s
    ));

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('students')
        .update({ [subject]: num })
        .eq('id', id);
      if (error) console.error('Error updating grade:', error);
    }
  };

  const updateName = async (id: string, value: string) => {
    // Optimistic
    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, name: value } : s
    ));

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('students')
        .update({ name: value })
        .eq('id', id);
      if (error) console.error('Error updating name:', error);
    }
  };

  const updateBirthYear = async (id: string, value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return;

    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, birth_year: num } : s
    ));

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('students')
        .update({ birth_year: num })
        .eq('id', id);
      if (error) {
        console.error('Error updating birth year:', error);
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          alert('ERROR DE BASE DE DATOS:\n\nLa columna "birth_year" no existe en tu tabla "students".\n\nAñádela en Supabase > Table Editor > students > Add Column (Type: int8 o int4).');
        }
      }
    }
  };

  const uploadPhoto = async (id: string, file: File) => {
    if (!isSupabaseConfigured) return;
    
    // Nombres probables para el bucket
    const BUCKET_OPTIONS = ['FOTOS JUGADORES', 'student-photos', 'fotos-jugadores', 'fotos_jugadores', 'photos'];
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.floor(Date.now() / 1000)}.${fileExt}`;
      
      let uploadSuccess = false;
      let finalPublicUrl = '';
      let usedBucket = '';

      console.log('--- Iniciando proceso de subida ---');

      // Intentar subir a los buckets probables
      for (const bucketName of BUCKET_OPTIONS) {
        console.log(`Probando bucket: ${bucketName}...`);
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file);

        if (!uploadError) {
          console.log(`¡Éxito en bucket: ${bucketName}!`);
          const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
          finalPublicUrl = publicUrl;
          usedBucket = bucketName;
          uploadSuccess = true;
          break;
        } else {
          console.warn(`Fallo en ${bucketName}:`, uploadError.message);
          // Si el error es de permisos (RLS), paramos aquí porque el bucket EXISTE pero faltan permisos
          if (uploadError.message.includes('security policy') || uploadError.message.includes('RLS') || uploadError.message.includes('403')) {
            alert(`ERROR DE PERMISOS en el bucket "${bucketName}":\n\nEl bucket existe pero NO tienes permiso para subir archivos.\n\nSolución:\n1. Ve a Storage > Policies en Supabase.\n2. En "${bucketName}", añade una política para "INSERT" y "SELECT" para el rol public.`);
            return;
          }
        }
      }

      if (!uploadSuccess) {
        alert('ERROR: No se pudo subir la foto.\n\nEn tu Supabase no existe un bucket llamado "FOTOS JUGADORES" o "student-photos" que sea público.\n\nCrea uno nuevo en Storage llamado "student-photos" (todo en minúsculas y con guion) y hazlo público.');
        return;
      }

      // 3. Actualizar Base de Datos
      // Según tus logs, ninguna de estas columnas existe. 
      // La prioridad es 'foto_jugador'.
      const columnNames = ['foto_jugador', 'photo_url', 'image_url', 'foto'];
      let dbUpdated = false;

      for (const col of columnNames) {
        const { error: updateError } = await supabase
          .from('students')
          .update({ [col]: finalPublicUrl })
          .eq('id', id);

        if (!updateError) {
          dbUpdated = true;
          setStudents(prev => prev.map(s => s.id === id ? { ...s, [col]: finalPublicUrl } : s));
          break;
        }
      }

      if (!dbUpdated) {
        alert('ERROR DE BASE DE DATOS:\n\nLa foto se subió con éxito, pero no pude guardarla en la tabla "students" porque no encontré la columna.\n\nSOLUCIÓN: Ejecuta esto en el SQL Editor de Supabase:\n\nALTER TABLE students ADD COLUMN foto_jugador text;');
      } else {
        alert('¡Foto guardada correctamente!');
      }
    } catch (err) {
      console.error('Error crítico en uploadPhoto:', err);
    }
  };

  const deleteStudent = async (id: string) => {
    // Optimistic
    setStudents(prev => prev.filter(s => s.id !== id));

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      if (error) console.error('Error deleting student:', error);
    }
  };

  const addStudent = async () => {
    const newStudentRef: Partial<Student> = {
      name: 'Nuevo Estudiante',
      math: 5,
      language: 5,
      birth_year: 2012
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('students')
        .insert([newStudentRef])
        .select();
      
      if (error) {
        console.error('Error adding student:', error);
      } else if (data) {
        setStudents(prev => [...prev, data[0]]);
        setEditingId(data[0].id);
      }
    } else {
      const newId = (Math.max(...students.map(s => parseInt(s.id) || 0), 0) + 1).toString();
      const localNew: Student = { ...newStudentRef as Student, id: newId };
      setStudents(prev => [...prev, localNew]);
      setEditingId(newId);
    }
  };

  const resetData = async () => {
    if (confirm("¿Seguro que quieres restablecer los datos iniciales? Se perderán los cambios actuales.")) {
      if (isSupabaseConfigured) {
        // Clear all and insert initial
        await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('students').insert(
          INITIAL_STUDENTS.map(({ id, ...s }) => s)
        );
        if (error) console.error('Error resetting:', error);
        fetchStudents();
      } else {
        setStudents(INITIAL_STUDENTS);
      }
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const getGradeColor = (grade: number) => {
    if (grade >= 7) return 'text-gold bg-gold/5';
    if (grade >= 5) return 'text-stone-300 bg-stone-800';
    return 'text-rose-500 bg-rose-500/5';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session && isSupabaseConfigured) {
    return <Auth />;
  }

  if (loading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center text-gold gap-4">
        <Loader2 className="animate-spin" size={48} />
        <p className="font-serif italic text-xl">Sincronizando con la Academia...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-stone-200 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* --- Header --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-stone-800/50">
          <div>
            <div className="flex items-center gap-2 text-gold mb-2">
              <GraduationCap size={20} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Academia Literaria y Matemática</span>
              {!isSupabaseConfigured && (
                <span className="ml-4 flex items-center gap-1 text-stone-600 border border-stone-800 px-2 py-0.5 rounded text-[8px]">
                  <CloudOff size={10} /> MODO LOCAL (SIN SUPABASE)
                </span>
              )}
              {isSupabaseConfigured && (
                <span className="ml-4 flex items-center gap-1 text-emerald-600/50 border border-emerald-900/30 px-2 py-0.5 rounded text-[8px]">
                  <CloudUpload size={10} /> PERSISTENCIA ACTIVA
                </span>
              )}
            </div>
            <h1 className="text-5xl font-serif italic text-gold leading-tight">
              Control de Calificaciones
            </h1>
            <p className="text-stone-500 uppercase tracking-[0.2em] text-[10px] font-semibold mt-2">Grupo 4º B • Gestión en Tiempo Real</p>
          </div>
          
          <div className="flex items-center gap-4">
            {session && (
              <div className="hidden md:flex items-center gap-3 mr-4 border-r border-stone-800 pr-4">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Conectado como</div>
                  <div className="text-xs text-gold italic font-serif">{session.user.email}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-stone-600 hover:text-rose-500 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
            <button 
              onClick={addStudent}
              className="px-6 py-2 border border-gold text-gold rounded-none hover:bg-gold hover:text-dark transition-all font-bold uppercase tracking-widest text-[10px] shadow-sm"
              id="add-student-btn"
            >
              Añadir Estudiante
            </button>
            <button 
              onClick={resetData}
              className="p-2 text-stone-600 hover:text-gold transition-colors"
              title="Restablecer datos"
              id="reset-data-btn"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        {/* --- Stats Grid --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Media Matemáticas" 
            value={stats.mathAvg} 
            icon={<Calculator className="text-gold" />} 
          />
          <StatCard 
            title="Media Lengua" 
            value={stats.langAvg} 
            icon={<Languages className="text-gold" />} 
          />
          <StatCard 
            title="Media Global" 
            value={stats.overallAvg} 
            icon={<TrendingUp className="text-gold" />} 
          />
          <StatCard 
            title="Tasa Aprobados" 
            value={stats.passRate} 
            icon={<Users className="text-gold" />} 
            suffix="%"
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* --- Student List --- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-stone-900/30 rounded-lg border border-stone-800 overflow-hidden">
              <div className="p-6 border-b border-stone-800 bg-stone-800/40 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest font-bold text-stone-400">Estudiantes</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={14} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nombre..." 
                    className="pl-9 pr-4 py-1.5 bg-stone-900 border border-stone-700 rounded-none text-xs text-stone-300 focus:outline-none focus:border-gold transition-all w-48 md:w-64 italic font-serif"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    id="search-input"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-stone-500 text-[10px] uppercase tracking-widest font-bold border-b border-stone-800/50">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Estudiante</th>
                      <th className="px-6 py-4 text-center">Nacimiento</th>
                      <th className="px-6 py-4 text-center">Matemáticas</th>
                      <th className="px-6 py-4 text-center">Lengua</th>
                      <th className="px-6 py-4 text-center text-gold">Promedio</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/30 text-sm">
                    <AnimatePresence mode="popLayout">
                      {filteredStudents.map((student, idx) => (
                        <motion.tr 
                          key={student.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-stone-600">
                            {student.id.padStart(2, '0')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="relative group/avatar cursor-pointer" onClick={() => document.getElementById(`file-upload-${student.id}`)?.click()}>
                                {student.foto_jugador ? (
                                  <img 
                                    src={student.foto_jugador} 
                                    alt={student.name} 
                                    className="w-10 h-10 rounded-full object-cover border border-stone-800 group-hover/avatar:border-gold transition-colors" 
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 font-bold text-xs border border-stone-700 group-hover/avatar:border-gold transition-colors uppercase">
                                    {(student.name || 'NN').substring(0, 2)}
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-dark/60 opacity-0 group-hover/avatar:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                                  <span className="text-[8px] text-gold font-bold uppercase">Subir</span>
                                </div>
                                <input 
                                  type="file" 
                                  id={`file-upload-${student.id}`} 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && uploadPhoto(student.id, e.target.files[0])}
                                />
                              </div>
                              
                              {editingId === student.id ? (
                                <input 
                                  autoFocus
                                  type="text"
                                  className="bg-stone-800 border-b border-gold text-stone-200 px-2 py-1 text-lg font-serif italic focus:outline-none"
                                  value={student.name}
                                  onChange={(e) => updateName(student.id, e.target.value)}
                                  onBlur={() => setEditingId(null)}
                                  onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                />
                              ) : (
                                <div 
                                  className="font-serif text-lg italic text-stone-300 cursor-pointer hover:text-gold transition-colors"
                                  onClick={() => setEditingId(student.id)}
                                >
                                  {student.name}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="number"
                              className="w-16 bg-transparent border-none text-stone-500 font-mono text-xs text-center focus:outline-none focus:text-gold"
                              value={student.birth_year}
                              onChange={(e) => updateBirthYear(student.id, e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <GradeInput 
                              value={student.math} 
                              onChange={(val) => updateGrade(student.id, 'math', val)} 
                              colorClass={getGradeColor(student.math)}
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <GradeInput 
                              value={student.language} 
                              onChange={(val) => updateGrade(student.id, 'language', val)} 
                              colorClass={getGradeColor(student.language)}
                            />
                          </td>
                          <td className="px-6 py-4 text-center font-serif italic text-gold font-bold">
                            {((student.math + student.language) / 2).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => deleteStudent(student.id)}
                              className="p-2 text-stone-700 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                              id={`delete-btn-${student.id}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                  {filteredStudents.length > 0 && (
                    <tfoot className="border-t-2 border-stone-800 bg-stone-900/50">
                      <tr className="text-stone-400 font-bold">
                        <td className="px-6 py-6" colSpan={3}>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></div>
                            <span className="text-[10px] uppercase tracking-[0.2em]">Promedios Globales Clase</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center text-lg text-gold font-serif italic">
                          {stats.mathAvg}
                        </td>
                        <td className="px-6 py-6 text-center text-lg text-gold font-serif italic">
                          {stats.langAvg}
                        </td>
                        <td className="px-6 py-6 text-center text-xl text-gold font-serif font-black underline decoration-stone-800 underline-offset-8">
                          {stats.overallAvg}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              
              {filteredStudents.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <div className="mb-2">No se encontraron alumnos</div>
                  <button 
                    onClick={() => setSearch('')}
                    className="text-indigo-600 text-sm font-medium hover:underline"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* --- Chart View --- */}
          <div className="space-y-8">
            <div className="bg-stone-900 border border-stone-800 p-8 rounded-lg shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gold opacity-5 blur-3xl -mr-16 -mt-16"></div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-8 font-bold">Rendimiento Comparativo</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={students} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis 
                      dataKey="name" 
                      hide={true}
                    />
                    <YAxis domain={[0, 10]} stroke="#444" fontSize={10} fontVariant="tabular-nums" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171717', borderRadius: '4px', border: '1px solid #262626', boxShadow: 'none' }}
                      itemStyle={{ color: '#c5a059', fontSize: '12px', fontFamily: 'serif', fontStyle: 'italic' }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    />
                    <Bar name="Matemáticas" dataKey="math" fill="#c5a059" radius={[2, 2, 0, 0]} barSize={8} />
                    <Bar name="Lengua" dataKey="language" fill="#78716c" radius={[2, 2, 0, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-8 rounded-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center text-gold">
                      <GraduationCap size={18} />
                   </div>
                   <div>
                     <p className="text-xs uppercase tracking-widest text-stone-500 font-bold">Estado del Curso</p>
                   </div>
                </div>
                
                <p className="text-xl font-serif italic text-stone-300 leading-relaxed">
                  {parseFloat(stats.overallAvg) >= 6 
                    ? "La excelencia académica es la norma. El grupo mantiene un promedio superior al objetivo semestral." 
                    : "Se requiere intervención pedagógica focalizada en el área de razonamiento lógico-matemático."}
                </p>
                
                <div className="mt-4 pt-6 border-t border-stone-800">
                   <button className="w-full py-3 border border-gold text-gold text-[10px] uppercase tracking-widest font-bold hover:bg-gold hover:text-dark transition-colors">
                     Generar Informe Académico
                   </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* --- Footer --- */}
        <footer className="mt-12 py-6 bg-stone-900/40 border-t border-stone-800 text-[10px] text-stone-600 flex flex-col md:flex-row justify-between gap-4 uppercase tracking-[0.1em] font-medium">
          <div className="flex gap-4">
            <span>SISTEMA DE GESTIÓN EDUCATIVA v3.2</span>
            <span className="text-stone-800">|</span>
            <span className="italic font-serif normal-case text-stone-500">"Scientia potentia est"</span>
          </div>
          <div className="flex gap-4">
            <span>USUARIO: {session?.user.email || 'INVITADO'}</span>
            <span className="text-stone-800">|</span>
            <span>LICENCIA: EDU_PROFESSIONAL</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// --- Sub-components ---

function StatCard({ title, value, icon, suffix }: { title: string, value: string | number, icon: React.ReactNode, suffix?: string }) {
  return (
    <div className="bg-stone-900 p-6 rounded-lg border border-stone-800 hover:border-gold/30 transition-all group overflow-hidden relative">
      <div className="absolute -right-4 -bottom-4 text-stone-800/10 group-hover:text-gold/5 transition-colors">
        {React.cloneElement(icon as React.ReactElement, { size: 80 })}
      </div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-2 rounded-md bg-stone-800 border border-stone-700/50">
          {icon}
        </div>
        <div className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">{title}</div>
      </div>
      <div className="flex items-baseline gap-1 relative z-10">
        <span className="text-4xl font-serif italic text-gold tracking-tighter">{value}</span>
        {suffix && <span className="text-stone-600 font-serif italic text-sm">{suffix}</span>}
      </div>
      <div className="mt-4 w-full bg-stone-800 h-1 rounded-full overflow-hidden">
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (parseFloat(value.toString()) / (suffix === '%' ? 100 : 10)) * 100)}%` }}
            className="bg-gold h-full"
         />
      </div>
    </div>
  );
}

function GradeInput({ value, onChange, colorClass }: { value: number, onChange: (val: string) => void, colorClass: string }) {
  return (
    <input 
      type="number" 
      step="0.1" 
      min="0" 
      max="10"
      className={cn(
        "w-16 px-2 py-1 rounded border-none font-mono text-sm text-center focus:outline-none transition-all",
        colorClass
      )}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

