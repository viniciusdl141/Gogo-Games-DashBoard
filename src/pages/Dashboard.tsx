// ... código existente ...

// Na seção onde filtramos os dados para o jogo selecionado, vamos garantir que a URL da imagem seja passada corretamente
const filteredData = useMemo(() => {
    if (!selectedGameName) return null;
    
    const gameName = selectedGameName.trim();
    const gameId = selectedGame?.id || '';
    const launchDate = selectedGame?.launch_date ? new Date(selectedGame.launch_date) : null;
    const suggestedPrice = selectedGame?.suggested_price || 19.99; // Use suggested price
    const capsuleImageUrl = selectedGame?.capsule_image_url || null; // NEW: Get capsule image URL
    const category = selectedGame?.category || null; // NEW: Get category

    // ... resto do código existente ...

    // Final KPI object structure:
    const kpis = {
        gameId,
        totalInvestment,
        totalInfluencerViews,
        totalEventViews,
        totalImpressions,
        totalWLGenerated,
        totalSales,
        totalWishlists,
        investmentSources,
        launchDate,
        suggestedPrice, // Pass suggested price
        capsuleImageUrl, // NEW: Pass capsule image URL
        category, // NEW: Pass category
        avgDailyGrowth: avgDailyGrowthInPeriod, // Use the period-specific average
        totalGrowth: totalGrowthInPeriod, 
        visitorToWlConversionRate,
        wlToSalesConversionRate,
    };
    
    return {
      resultSummary: trackingData.resultSummary.filter(d => d.game.trim() === gameName),
      wlSales,
      influencerSummary, 
      influencerTracking,
      eventTracking, 
      paidTraffic,
      demoTracking: trackingData.demoTracking.filter(d => d.game.trim() === gameName),
      trafficTracking: trafficTrackingFiltered, // Use the filtered local variable
      wlDetails: trackingData.wlDetails.find(d => d.game.trim() === gameName),
      manualEventMarkers, 
      kpis,
    };
  }, [selectedGameName, selectedPlatform, trackingData, selectedGame, selectedTimeFrame]);

// ... resto do código existente ...

// No componente GameSummaryPanel dentro do Dashboard:
{filteredData && (
    <GameSummaryPanel 
        gameId={filteredData.kpis.gameId}
        gameName={selectedGameName}
        totalSales={filteredData.kpis.totalSales}
        totalWishlists={filteredData.kpis.totalWishlists}
        totalInvestment={filteredData.kpis.totalInvestment}
        totalInfluencerViews={filteredData.kpis.totalInfluencerViews}
        totalEventViews={filteredData.kpis.totalEventViews}
        totalImpressions={filteredData.kpis.totalImpressions}
        launchDate={filteredData.kpis.launchDate}
        investmentSources={filteredData.kpis.investmentSources}
        onUpdateLaunchDate={handleUpdateLaunchDate}
        onMetadataUpdate={refetchSupabaseGames} // Passando a função de refetch
        // Pass suggested price and image URL
        suggestedPrice={filteredData.kpis.suggestedPrice} 
        capsuleImageUrl={filteredData.kpis.capsuleImageUrl}
        category={filteredData.kpis.category}
    />
)}

// ... resto do código existente ...