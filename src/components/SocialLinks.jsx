
import React from 'react';
import { Button } from '@/components/ui/button';

export function SocialLinks({ links, playSound, toast }) {
  const handleSocialClick = (url, name) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    playSound('uiClick');
    toast({
        title: `🔗 Visitando ${name}`,
        description: `¡Gracias por visitar nuestra página de ${name}! No olvides seguirnos.`,
        duration: 3000
    });
  };

  return (
    <div className="flex items-center justify-center space-x-2 md:space-x-3">
      {links.map(link => (
        <Button
          key={link.name}
          variant="ghost"
          size="icon"
          className="social-icon text-muted-foreground hover:text-primary mobile-button"
          onClick={() => handleSocialClick(link.url, link.name)}
          aria-label={link.name}
        >
          <link.icon className="w-5 h-5 md:w-6 md:h-6" />
        </Button>
      ))}
    </div>
  );
}
