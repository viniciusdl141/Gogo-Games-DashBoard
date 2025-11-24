<Dialog open={isAddEventFormOpen} onOpenChange={setIsAddEventFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Tracking de Evento</DialogTitle>
                  </DialogHeader>
                  <AddEventForm 
                    games={[selectedGame]}
                    onSave={handleAddEvent}
                    onClose={() => setIsAddEventFormOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={isAddPaidTrafficFormOpen} onOpenChange={setIsAddPaidTrafficFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Tráfego Pago</DialogTitle>
                  </DialogHeader>
                  <AddPaidTrafficForm 
                    games={[selectedGame]}
                    onSave={handleAddPaidTraffic}
                    onClose={() => setIsAddPaidTrafficFormOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDemoFormOpen} onOpenChange={setIsAddDemoFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Tracking de Demo</DialogTitle>
                  </DialogHeader>
                  <AddDemoForm 
                    gameName={selectedGame}
                    onSave={handleAddDemo}
                    onClose={() => setIsAddDemoFormOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Modal de Adicionar Jogo */}
      <AddGameModal 
        isOpen={isAddGameModalOpen}
        onClose={() => setIsAddGameModalOpen(false)}
        onSave={async (gameName, launchDate, suggestedPrice, capsuleImageUrl) => {
          try {
            const { error } = await supabase
              .from('games')
              .insert([{
                name: gameName,
                launch_date: launchDate,
                suggested_price: suggestedPrice,
                capsule_image_url: capsuleImageUrl,
              }]);
            
            if (error) throw error;
            
            queryClient.invalidateQueries({ queryKey: ['supabaseData'] });
            setSelectedGame(gameName);
            setIsAddGameModalOpen(false);
          } catch (error) {
            console.error('Error adding game:', error);
          }
        }}
      />

      {/* Modal de Processamento de Dados por IA */}
      <Dialog open={isAIDataProcessorOpen} onOpenChange={setIsAIDataProcessorOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Processamento de Dados por IA</DialogTitle>
          </DialogHeader>
          <AIDataProcessor 
            gameName={selectedGame}
            onDataProcessed={(structuredData) => {
              // Processar os dados estruturados e salvar no Supabase
              console.log('Structured data received:', structuredData);
              // Implementar lógica para salvar os dados no Supabase
            }}
            onClose={() => setIsAIDataProcessorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Ação de WL/Vendas */}
      <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <WLSalesActionMenu 
            entry={selectedWLSalesEntry!}
            existingMarker={filteredData.manualEventMarkers.find(m => 
              m.date.getTime() === selectedWLSalesEntry?.date?.getTime()
            )}
            gameName={selectedGame}
            onEditWLSales={(entry) => handleEditTracking(entry, 'wl_sales')}
            onSaveManualMarker={async (values) => {
              try {
                const { error } = await supabase
                  .from('manual_event_markers')
                  .insert([{
                    game: selectedGame,
                    date: values.date,
                    name: values.name,
                  }]);
                
                if (error) throw error;
                
                queryClient.invalidateQueries({ queryKey: ['supabaseData'] });
              } catch (error) {
                console.error('Error saving manual marker:', error);
              }
            }}
            onDeleteManualMarker={async (id) => {
              try {
                const { error } = await supabase
                  .from('manual_event_markers')
                  .delete()
                  .eq('id', id);
                
                if (error) throw error;
                
                queryClient.invalidateQueries({ queryKey: ['supabaseData'] });
              } catch (error) {
                console.error('Error deleting manual marker:', error);
              }
            }}
            onClose={() => setIsActionMenuOpen(false)}
            // Passar todos os dados necessários para o resumo diário
            allWLSales={filteredData.wlSales}
            allInfluencerTracking={filteredData.influencerTracking}
            allEventTracking={filteredData.eventTracking}
            allPaidTraffic={filteredData.paidTraffic}
            allDemoTracking={filteredData.demoTracking}
            allManualEventMarkers={filteredData.manualEventMarkers}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Detalhes de WL */}
      <Dialog open={isWlDetailsManagerOpen} onOpenChange={setIsWlDetailsManagerOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Detalhes da Página Steam</DialogTitle>
          </DialogHeader>
          {selectedGame && (
            <WlDetailsManager 
              details={filteredData.wlDetails.find(d => d.game === selectedGame) || {
                game: selectedGame,
                reviews: [],
                bundles: [],
                traffic: [],
              }}
              gameName={selectedGame}
              allGames={filteredData.games}
              onUpdateDetails={async (game, newDetails) => {
                // Implementar lógica para atualizar detalhes
                console.log('Update details for', game, newDetails);
              }}
              onAddTraffic={async (data) => {
                try {
                  const { error } = await supabase
                    .from('traffic_tracking')
                    .insert([{
                      game: data.game,
                      platform: data.platform,
                      start_date: data.startDate,
                      end_date: data.endDate,
                      visits: data.visits,
                      impressions: data.impressions || 0,
                      clicks: data.clicks || 0,
                      source: data.source,
                    }]);
                  
                  if (error) throw error;
                  
                  queryClient.invalidateQueries({ queryKey: ['supabaseData'] });
                } catch (error) {
                  console.error('Error adding traffic:', error);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Formulários Modais */}
      <Dialog open={isAddWLSalesFormOpen} onOpenChange={setIsAddWLSalesFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Dados de WL/Vendas</DialogTitle>
          </DialogHeader>
          <AddWLSalesForm 
            games={[selectedGame]}
            onSave={handleAddWLSales}
            onClose={() => setIsAddWLSalesFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddInfluencerFormOpen} onOpenChange={setIsAddInfluencerFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Tracking de Influencer</DialogTitle>
          </DialogHeader>
          <AddInfluencerForm 
            games={[selectedGame]}
            onSave={handleAddInfluencer}
            onClose={() => setIsAddInfluencerFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddEventFormOpen} onOpenChange={setIsAddEventFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Tracking de Evento</DialogTitle>
          </DialogHeader>
          <AddEventForm 
            games={[selectedGame]}
            onSave={handleAddEvent}
            onClose={() => setIsAddEventFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddPaidTrafficFormOpen} onOpenChange={setIsAddPaidTrafficFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Tráfego Pago</DialogTitle>
          </DialogHeader>
          <AddPaidTrafficForm 
            games={[selectedGame]}
            onSave={handleAddPaidTraffic}
            onClose={() => setIsAddPaidTrafficFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDemoFormOpen} onOpenChange={setIsAddDemoFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Tracking de Demo</DialogTitle>
          </DialogHeader>
          <AddDemoForm 
            gameName={selectedGame}
            onSave={handleAddDemo}
            onClose={() => setIsAddDemoFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;