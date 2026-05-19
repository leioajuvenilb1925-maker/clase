import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Loader2, 
  GraduationCap, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user && data.session) {
           setMessage('¡Cuenta creada y sesión iniciada!');
        } else {
           setMessage('Revisa tu bandeja de entrada (y Spam) para confirmar tu cuenta.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-full border border-gold/20 bg-gold/5 text-gold mb-4">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-4xl font-serif italic text-gold mb-2">Portal de Academia</h1>
          <p className="text-stone-500 uppercase tracking-[0.2em] text-[10px] font-semibold">
            {isSignUp ? 'Crear nueva cuenta docente' : 'Acceso Administrador de Centro'}
          </p>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-8 rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold opacity-5 blur-3xl -mr-16 -mt-16"></div>
          
          {!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id') ? (
            <div className="text-center py-4 space-y-4 relative z-10">
              <AlertCircle className="mx-auto text-amber-500" size={32} />
              <div className="text-xs text-stone-400 italic">
                Detectamos que las claves de Supabase aún no se han cargado correctamente. 
                <br /><br />
                Si acabas de configurarlas en <b>Secrets</b>, por favor <b>pulsa el botón de refrescar</b> del navegador de la derecha.
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-6 relative z-10">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded flex items-start gap-2 italic"
                  >
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded flex items-start gap-2 italic"
                  >
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={16} />
                  <input 
                    type="email"
                    required
                    placeholder="admin@academia.edu"
                    className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-800 focus:border-gold outline-none transition-all text-sm italic font-serif text-stone-200"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={16} />
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-800 focus:border-gold outline-none transition-all text-sm font-mono text-stone-200"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gold text-dark font-bold uppercase tracking-[0.2em] text-xs hover:bg-[#d8b068] transition-colors flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    {isSignUp ? 'Registrar Cuenta' : 'Iniciar Sesión'}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-stone-800 text-center space-y-4">
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-gold transition-colors font-bold"
            >
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>

            {!isSignUp && (
              <div className="p-3 bg-stone-950/50 rounded text-[9px] text-stone-600 italic leading-relaxed">
                ¿Problemas al entrar? Si no recibes el correo, recuerda desactivar <b>"Confirm Email"</b> en la configuración de Authentication de tu proyecto de Supabase.
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-stone-700 uppercase tracking-[0.1em]">
          Powered by Academia Literaria y Matemática System v3.0
        </p>
      </motion.div>
    </div>
  );
}
