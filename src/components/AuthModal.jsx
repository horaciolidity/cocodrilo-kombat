
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

export function AuthModal({ showAuth, setShowAuth, setUser, toast, playSound }) {
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = (e) => {
    e.preventDefault();
    if (authMode === 'register' && authForm.password !== authForm.confirmPassword) {
      toast({ title: "❌ Error", description: "Las contraseñas no coinciden", duration: 3000, variant: "destructive" });
      playSound('error');
      return;
    }

    const userData = { id: Date.now(), email: authForm.email, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() };
    setUser(userData);
    localStorage.setItem('cocodriloKombatUser', JSON.stringify(userData));
    setShowAuth(false);
    setAuthForm({ email: '', password: '', confirmPassword: '' });
    toast({ title: "✅ ¡Bienvenido!", description: authMode === 'login' ? "Sesión iniciada correctamente" : "Cuenta creada exitosamente", duration: 3000 });
    playSound(authMode === 'login' ? 'login' : 'success');
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    playSound('uiClick');
  };
  
  const handleClose = () => {
    setShowAuth(false);
    playSound('uiClose');
  };

  if (!showAuth) return null;

  return (
    <motion.div
      className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="modal-content rounded-xl p-6 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
          </h2>
          <Button onClick={handleClose} variant="ghost" size="sm" className="mobile-button">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" value={authForm.email} onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))} className="w-full p-3 rounded-lg bg-input border border-border text-foreground mobile-button" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={authForm.password} onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))} className="w-full p-3 rounded-lg bg-input border border-border text-foreground pr-12 mobile-button" required />
              <Button type="button" onClick={() => {setShowPassword(!showPassword); playSound('uiClick');}} variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 mobile-button">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-medium mb-2">Confirmar Contraseña</label>
              <input type={showPassword ? 'text' : 'password'} value={authForm.confirmPassword} onChange={(e) => setAuthForm(prev => ({ ...prev, confirmPassword: e.target.value }))} className="w-full p-3 rounded-lg bg-input border border-border text-foreground mobile-button" required />
            </div>
          )}
          <Button type="submit" className="w-full mobile-button bg-primary hover:bg-primary/90 text-primary-foreground">
            {authMode === 'login' ? <><LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión</> : <><UserPlus className="w-4 h-4 mr-2" /> Registrarse</>}
          </Button>
          <div className="text-center">
            <Button type="button" onClick={toggleAuthMode} variant="link" className="mobile-button">
              {authMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
