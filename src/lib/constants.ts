// src/lib/constants.ts

// Mock data for categories (should eventually come from DB or configuration)
export const MOCK_CATEGORIES = ['Ação', 'Terror', 'RPG', 'Estratégia', 'Simulação', 'Aventura', 'Visual Novel', 'Casual', 'Outro'];

// Multiplicadores Simon Carless (NB)
export const NB_MULTIPLIERS = [
    { label: 'Antes de 2017 (65)', value: 65 },
    { label: '2019 - 2022 (35)', value: 35 },
    { label: '2023 - 2025 (32)', value: 32 },
    { label: 'Viral (22)', value: 22 },
];

// Multiplicadores CCU (SteamDB)
export const CCU_MULTIPLIERS = [
    { label: 'Multiplayer/Coop (40)', value: 40, genre: 'Multiplayer' },
    { label: 'Singleplayer (100)', value: 100, genre: 'Singleplayer' },
];

// Multiplicadores VG Insights (Gênero)
export const VG_INSIGHTS_MULTIPLIERS: Record<string, number> = {
    'Terror': 30,
    'RPG': 30,
    'Estratégia': 30,
    'Simulação': 55,
    'Casual': 55,
    'Visual Novel': 40,
    'Ação': 35, 
    'Aventura': 35,
    'Outro': 35,
};

export interface MethodDetails {
    label: string;
    description: string;
    source: string;
}

export const METHOD_DETAILS: Record<string, MethodDetails> = {
    'Boxleiter Ajustado (M=30)': {
        label: 'Boxleiter Ajustado (M=30)',
        description: 'Esta é a fórmula clássica de estimativa de vendas, baseada na premissa de que cada review na Steam corresponde a um número fixo de vendas. O multiplicador de 30x é um ajuste moderno para jogos lançados entre 2014 e 2017. É uma estimativa de ciclo de vida total, mas pode ser imprecisa para jogos muito recentes ou nichados. **É a base teórica para a maioria dos outros métodos.**',
        source: 'Referência Original: Artigo de Jake Birkett (Grey Alien Games) que estabeleceu a lógica "1 review ≈ X vendas".'
    },
    'Simon Carless (NB)': {
        label: 'Simon Carless (NB)',
        description: 'O método Simon Carless (NB Number) ajusta o multiplicador de reviews com base no ano de lançamento do jogo. Isso é crucial porque a Valve mudou a forma como solicita reviews, afetando a taxa de conversão. O multiplicador de 32x (para 2023-2025) é mais conservador e reflete a saturação do mercado e a mudança de comportamento dos usuários. **É ideal para jogos recém-lançados.**',
        source: 'Referência: Simon Carless (GameDiscoverCo) explica a mudança do multiplicador (30x-60x) para jogos pós-2022 no Game World Observer.'
    },
    'Gamalytic (Preço Ponderado)': {
        label: 'Gamalytic (Preço Ponderado)',
        description: 'A Gamalytic utiliza um multiplicador que é ajustado pelo preço do jogo. Jogos muito baratos (<R$25) tendem a ter menos reviews por venda (M=20), enquanto jogos caros (>R$100) tendem a ter mais reviews por venda (M=50). Este método tenta corrigir o viés de que jogos mais caros têm um público mais engajado que deixa reviews. **Foca em como o preço afeta a taxa de conversão de reviews.**',
        source: 'Referência: Documentação oficial da Gamalytic, detalhando o uso de probabilidade condicional para corrigir vieses de preço.'
    },
    'VG Insights (Gênero Ponderado)': {
        label: 'VG Insights (Gênero Ponderado)',
        description: 'Este método ajusta o multiplicador de reviews com base no gênero do jogo. Gêneros de nicho e alto engajamento (RPG, Horror, Estratégia) têm multiplicadores mais baixos (M=30), pois seus fãs são mais propensos a deixar reviews. Gêneros casuais (Simulação, Puzzle) têm multiplicadores mais altos (M=55). **É essencial para entender o engajamento do público-alvo.**',
        source: 'Referência: Estudo da VG Insights sobre a relação Reviews/Vendas por Gênero. Publicam relatórios anuais cruciais.'
    },
    'SteamDB CCU': {
        label: 'SteamDB CCU',
        description: 'Estima as vendas totais com base no Pico de Jogadores Simultâneos (CCU All-Time Peak). O multiplicador é 40x para jogos Multiplayer/Co-op e 100x para Singleplayer. Este método é mais preciso para estimar o desempenho no **primeiro ano de lançamento** e é menos afetado por promoções tardias. **Requer o dado de CCU Peak.**',
        source: 'Referência: Dados públicos do SteamDB. A regra de 20x-50x o CCU da primeira semana é baseada em post-mortems de desenvolvedores (Ars Technica/Gamasutra).'
    },
    'Receita Simplificada (Fator 0.65)': {
        label: 'Receita Simplificada',
        description: 'Uma estimativa direta da Receita Líquida, assumindo um multiplicador base de 30x e aplicando um fator de 0.65 (65%) para remover a taxa da Steam (30%) e impostos/custos operacionais. **Foca no retorno financeiro líquido.**',
        source: 'Referência: Fórmulas de cálculo de receita líquida pós-Steam (30% fee).'
    },
    'Média Híbrida': {
        label: 'Média Híbrida',
        description: 'A Média Híbrida combina os resultados de todos os métodos selecionados (ou calculáveis) para mitigar vieses de um único modelo. Ao usar múltiplos pontos de vista (preço, gênero, CCU, histórico), ela fornece uma estimativa mais robusta e confiável do ciclo de vida total do jogo.',
        source: 'Metodologia interna GoGo Games, baseada na consolidação de múltiplas fontes de dados de mercado.'
    }
};

export interface Reference {
    title: string;
    source: string;
    description: string;
    url: string;
}

export const REFERENCES: Record<string, Reference[]> = {
    'Metodologias de Reviews': [
        {
            title: 'The Boxleiter Method: Estimating Steam Sales',
            source: 'Jake Birkett (Grey Alien Games)',
            description: 'A fórmula original que estabeleceu a relação entre o número de reviews e as vendas totais (1 review ≈ 30 vendas).',
            url: 'https://www.gamasutra.com/blogs/JakeBirkett/20140407/214892/The_Boxleiter_Method_Estimating_Steam_Sales.php',
        },
        {
            title: 'GameDiscoverCo: The NB Number',
            source: 'Simon Carless (GameDiscoverCo)',
            description: 'Análise moderna sobre a taxa de conversão de reviews, introduzindo o "NB Number" (32x-35x) para jogos recentes.',
            url: 'https://gamediscover.co/p/the-nb-number-and-steam-sales-estimates',
        },
    ],
    'Análise de Mercado e CCU': [
        {
            title: 'VG Insights: Sales Multipliers by Genre',
            source: 'VG Insights',
            description: 'Estudos detalhados sobre como o gênero e o preço afetam o multiplicador de reviews.',
            url: 'https://vginsights.com/blog/steam-sales-multipliers',
        },
        {
            title: 'SteamDB CCU Multiplier Logic',
            source: 'SteamDB / Developer Post-mortems',
            description: 'Regra empírica que estima vendas totais com base no pico de jogadores simultâneos (CCU Peak).',
            url: 'https://steamdb.info/',
        },
    ],
};