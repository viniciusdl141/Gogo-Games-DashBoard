// ... (código anterior permanece igual até a parte do return) ...

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans gaming-background">
      {/* Componente que cria o estúdio padrão automaticamente quando administrador acessa */}
      {isAdmin && <CreateDefaultStudio />}

      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[calc(100vh-64px)] w-full rounded-lg border border-border bg-card text-card-foreground shadow-gogo-cyan-glow transition-shadow duration-300"
      >
        {/* ... resto do código permanece igual ... */}