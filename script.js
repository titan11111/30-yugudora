// ユグドラ幻想戦記 - メインスクリプト（完全版）

// ゲームの状態を管理するオブジェクト
const game = {
    currentScreen: 'title',
    currentStage: 1,
    playerTurn: true,
    summonGauge: 0,
    selectedUnit: null,
    actionMode: 'none',
    musicEnabled: true,
    currentBGM: null,

    // マップデータ（5x5）
    map: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ],

    // キャラクターの位置とデータ
    units: {
        player: { x: 1, y: 4, hp: 120, maxHp: 120, symbol: '♠' },
        enemies: [],
        mechs: [] // 機兵リスト
    }
};

// 音声管理オブジェクト
const audioManager = {
    bgmElements: {},
    seElements: {},
    masterVolume: 0.5,

    // 音声要素を初期化
    init() {
        // BGM要素を取得
        this.bgmElements = {
            title: document.getElementById('title-bgm'),
            battle: document.getElementById('battle-bgm'),
            clear: document.getElementById('clear-bgm')
        };
        
        // SE要素を取得
        this.seElements = {
            attack: document.getElementById('attack-se'),
            levelup: document.getElementById('levelup-se'),
            hit: document.getElementById('fuseikai-se'),
            move: document.getElementById('seikai-se')
        };
        
        // 音量設定
        this.setVolume(this.masterVolume);
        
        console.log('音声管理システム初期化完了');
    },

    // 音量設定
    setVolume(volume) {
        this.masterVolume = volume;
        
        // BGMの音量設定
        Object.values(this.bgmElements).forEach(audio => {
            if (audio) audio.volume = volume * 0.7; // BGMは少し小さめに
        });
        
        // SEの音量設定
        Object.values(this.seElements).forEach(audio => {
            if (audio) audio.volume = volume;
        });
    },

    // BGM再生
    playBGM(type) {
        this.stopBGM(); // 現在のBGMを停止
        
        if (!game.musicEnabled) return;
        
        const bgm = this.bgmElements[type];
        if (bgm) {
            bgm.currentTime = 0;
            const playPromise = bgm.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`BGM再生開始: ${type}`);
                    game.currentBGM = type;
                }).catch(error => {
                    console.log('BGM再生エラー:', error);
                });
            }
        }
    },

    // BGM停止
    stopBGM() {
        Object.values(this.bgmElements).forEach(audio => {
            if (audio && !audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        game.currentBGM = null;
    },

    // SE再生
    playSE(type) {
        if (!game.musicEnabled) return;
        
        const se = this.seElements[type];
        if (se) {
            se.currentTime = 0;
            const playPromise = se.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`SE再生: ${type}`);
                }).catch(error => {
                    console.log('SE再生エラー:', error);
                });
            }
        }
    }
};

// ステージデータ（全面難易度調整）
const stageData = {
    1: {
        name: "第1面 - 森の入口",
        story: "世界樹の森で最初の敵と遭遇...",
        enemies: [
            { x: 0, y: 0, hp: 25, maxHp: 25, symbol: '🧌', type: 'goblin', name: 'ゴブリン' },
            { x: 2, y: 0, hp: 25, maxHp: 25, symbol: '🧌', type: 'goblin', name: 'ゴブリン' },
            { x: 4, y: 0, hp: 25, maxHp: 25, symbol: '🧌', type: 'goblin', name: 'ゴブリン' },
            { x: 1, y: 1, hp: 35, maxHp: 35, symbol: '👹', type: 'orc', name: 'オーク' },
            { x: 3, y: 1, hp: 35, maxHp: 35, symbol: '👹', type: 'orc', name: 'オーク' },
            { x: 2, y: 2, hp: 40, maxHp: 40, symbol: '👹', type: 'orc', name: 'オーク隊長' }
        ]
    },
    2: {
        name: "第2面 - 古い遺跡",
        story: "古代の遺跡でアンデッドが蘇る...",
        enemies: [
            { x: 0, y: 0, hp: 25, maxHp: 25, symbol: '💀', type: 'skeleton', name: 'スケルトン' },
            { x: 4, y: 0, hp: 25, maxHp: 25, symbol: '💀', type: 'skeleton', name: 'スケルトン' },
            { x: 1, y: 1, hp: 25, maxHp: 25, symbol: '💀', type: 'skeleton', name: 'スケルトン' },
            { x: 3, y: 1, hp: 25, maxHp: 25, symbol: '💀', type: 'skeleton', name: 'スケルトン' },
            { x: 0, y: 2, hp: 25, maxHp: 25, symbol: '💀', type: 'skeleton', name: 'スケルトン' },
            { x: 2, y: 2, hp: 45, maxHp: 45, symbol: '🧙', type: 'wizard', name: 'ネクロマンサー' }
        ]
    },
    3: {
        name: "第3面 - 暗黒の洞窟",
        story: "暗闇の中から魔物たちが襲いかかる...",
        enemies: [
            { x: 0, y: 0, hp: 30, maxHp: 30, symbol: '🧌', type: 'goblin', name: 'ダークゴブリン' },
            { x: 4, y: 0, hp: 30, maxHp: 30, symbol: '🧌', type: 'goblin', name: 'ダークゴブリン' },
            { x: 2, y: 1, hp: 45, maxHp: 45, symbol: '👹', type: 'orc', name: 'オークウォリアー' },
            { x: 1, y: 2, hp: 50, maxHp: 50, symbol: '🐉', type: 'dragon', name: 'ワイバーン' },
            { x: 3, y: 2, hp: 50, maxHp: 50, symbol: '🐉', type: 'dragon', name: 'ワイバーン' },
            { x: 0, y: 1, hp: 35, maxHp: 35, symbol: '🧌', type: 'goblin', name: 'ダークゴブリン' }
        ]
    },
    4: {
        name: "第4面 - 氷の神殿",
        story: "氷に閉ざされた神殿の守護者...",
        enemies: [
            { x: 1, y: 0, hp: 55, maxHp: 55, symbol: '🗿', type: 'golem', name: 'アイスゴーレム' },
            { x: 3, y: 0, hp: 55, maxHp: 55, symbol: '🗿', type: 'golem', name: 'アイスゴーレム' },
            { x: 2, y: 2, hp: 65, maxHp: 65, symbol: '🧙', type: 'wizard', name: '氷の魔法使い' },
            { x: 0, y: 1, hp: 45, maxHp: 45, symbol: '💀', type: 'skeleton', name: '氷スケルトン' },
            { x: 4, y: 1, hp: 45, maxHp: 45, symbol: '💀', type: 'skeleton', name: '氷スケルトン' },
            { x: 2, y: 0, hp: 50, maxHp: 50, symbol: '🗿', type: 'golem', name: 'アイスゴーレム' }
        ]
    },
    5: {
        name: "第5面 - 炎の火山",
        story: "灼熱の溶岩から炎の魔物が現れる...",
        enemies: [
            { x: 0, y: 1, hp: 50, maxHp: 50, symbol: '👺', type: 'demon', name: '炎の悪魔' },
            { x: 4, y: 1, hp: 50, maxHp: 50, symbol: '👺', type: 'demon', name: '炎の悪魔' },
            { x: 2, y: 0, hp: 70, maxHp: 70, symbol: '🐉', type: 'dragon', name: 'ファイアドラゴン' },
            { x: 1, y: 2, hp: 45, maxHp: 45, symbol: '👺', type: 'demon', name: '炎の悪魔' },
            { x: 3, y: 2, hp: 45, maxHp: 45, symbol: '👺', type: 'demon', name: '炎の悪魔' },
            { x: 0, y: 0, hp: 55, maxHp: 55, symbol: '🐉', type: 'dragon', name: 'ファイアドラゴン' }
        ]
    },
    6: {
        name: "第6面 - 嵐の高原",
        story: "雷鳴轟く高原で風の精霊と戦う...",
        enemies: [
            { x: 1, y: 1, hp: 60, maxHp: 60, symbol: '🧙', type: 'wizard', name: '嵐の魔道師' },
            { x: 3, y: 1, hp: 60, maxHp: 60, symbol: '🧙', type: 'wizard', name: '嵐の魔道師' },
            { x: 2, y: 0, hp: 80, maxHp: 80, symbol: '🦅', type: 'phoenix', name: 'ストームバード' },
            { x: 0, y: 0, hp: 50, maxHp: 50, symbol: '🧙', type: 'wizard', name: '嵐の魔道師' },
            { x: 4, y: 0, hp: 50, maxHp: 50, symbol: '🧙', type: 'wizard', name: '嵐の魔道師' },
            { x: 2, y: 2, hp: 65, maxHp: 65, symbol: '🦅', type: 'phoenix', name: 'ストームバード' }
        ]
    },
    7: {
        name: "第7面 - 毒の沼地",
        story: "毒に侵された沼地の番人たち...",
        enemies: [
            { x: 0, y: 0, hp: 45, maxHp: 45, symbol: '💀', type: 'skeleton', name: 'ポイズンスケルトン' },
            { x: 4, y: 0, hp: 45, maxHp: 45, symbol: '💀', type: 'skeleton', name: 'ポイズンスケルトン' },
            { x: 1, y: 2, hp: 65, maxHp: 65, symbol: '👺', type: 'demon', name: '毒の悪魔' },
            { x: 3, y: 2, hp: 65, maxHp: 65, symbol: '👺', type: 'demon', name: '毒の悪魔' },
            { x: 2, y: 1, hp: 55, maxHp: 55, symbol: '💀', type: 'skeleton', name: 'ポイズンスケルトン' },
            { x: 0, y: 2, hp: 60, maxHp: 60, symbol: '👺', type: 'demon', name: '毒の悪魔' }
        ]
    },
    8: {
        name: "第8面 - 光の塔",
        story: "聖なる光の塔で堕ちた天使と対峙...",
        enemies: [
            { x: 2, y: 0, hp: 75, maxHp: 75, symbol: '😇', type: 'lich', name: '堕天使' },
            { x: 0, y: 2, hp: 65, maxHp: 65, symbol: '🗿', type: 'golem', name: 'ホーリーゴーレム' },
            { x: 4, y: 2, hp: 65, maxHp: 65, symbol: '🗿', type: 'golem', name: 'ホーリーゴーレム' },
            { x: 1, y: 1, hp: 60, maxHp: 60, symbol: '😇', type: 'lich', name: '堕天使' },
            { x: 3, y: 1, hp: 60, maxHp: 60, symbol: '😇', type: 'lich', name: '堕天使' },
            { x: 2, y: 2, hp: 70, maxHp: 70, symbol: '🗿', type: 'golem', name: 'ホーリーゴーレム' }
        ]
    },
    9: {
        name: "第9面 - 闇の城",
        story: "闇の王の居城、最後の試練...",
        enemies: [
            { x: 1, y: 0, hp: 70, maxHp: 70, symbol: '💀', type: 'lich', name: 'リッチロード' },
            { x: 3, y: 0, hp: 70, maxHp: 70, symbol: '💀', type: 'lich', name: 'リッチロード' },
            { x: 2, y: 1, hp: 100, maxHp: 100, symbol: '👹', type: 'demon', name: '闇の王' },
            { x: 0, y: 1, hp: 65, maxHp: 65, symbol: '💀', type: 'lich', name: 'リッチロード' },
            { x: 4, y: 1, hp: 65, maxHp: 65, symbol: '💀', type: 'lich', name: 'リッチロード' },
            { x: 2, y: 0, hp: 85, maxHp: 85, symbol: '👹', type: 'demon', name: '闇の王' }
        ]
    },
    10: {
        name: "第10面 - 世界樹の根元",
        story: "世界樹を蝕む最終ボス、ベヒーモス...",
        enemies: [
            { x: 2, y: 1, hp: 120, maxHp: 120, symbol: '👹', type: 'behemoth', name: 'ベヒーモス' },
            { x: 0, y: 0, hp: 80, maxHp: 80, symbol: '🐉', type: 'phoenix', name: 'ダークフェニックス' },
            { x: 4, y: 0, hp: 80, maxHp: 80, symbol: '🐉', type: 'phoenix', name: 'ダークフェニックス' },
            { x: 1, y: 2, hp: 70, maxHp: 70, symbol: '💀', type: 'lich', name: 'リッチロード' },
            { x: 3, y: 2, hp: 70, maxHp: 70, symbol: '💀', type: 'lich', name: 'リッチロード' },
            { x: 2, y: 0, hp: 90, maxHp: 90, symbol: '👺', type: 'demon', name: '闇の守護者' }
        ]
    }
};

// アクションゲーム用の変数
let actionGame = {
    canvas: null,
    ctx: null,
    player: { x: 200, y: 150, size: 20, color: '#4fc3f7' },
    enemies: [],
    keys: {},
    animationId: null
};

// ページが読み込まれたときに実行
document.addEventListener('DOMContentLoaded', function() {
    initGame();
});

// ゲームの初期化
function initGame() {
    console.log('ゲーム初期化開始');

    // 音声システム初期化
    audioManager.init();

    // タイトル画面のボタン
    document.getElementById('start-btn').addEventListener('click', showStoryScreen);

    // ストーリー画面のボタン
    document.getElementById('story-next-btn').addEventListener('click', showBattleScreen);

    // バトル画面のボタン
    document.getElementById('move-btn').addEventListener('click', () => setActionMode('move'));
    document.getElementById('attack-btn').addEventListener('click', () => setActionMode('attack'));
    document.getElementById('summon-btn').addEventListener('click', startSummonMode);
    document.getElementById('end-turn-btn').addEventListener('click', endPlayerTurn);

    // 結果画面のボタン
    document.getElementById('next-stage-btn').addEventListener('click', nextStage);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('title-btn').addEventListener('click', returnToTitle);

    // 音楽制御
    document.getElementById('music-toggle').addEventListener('click', toggleMusic);
    document.getElementById('volume-slider').addEventListener('input', changeVolume);

    // キーボード操作
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // スマホ用コントローラー
    setupMobileControls();

    // 音楽開始（ユーザー操作後に自動再生されるように準備）
    if (game.musicEnabled) {
        // 最初のクリックで音楽を開始
        document.addEventListener('click', startAudioContext, { once: true });
    }

    console.log('ゲーム初期化完了');
}

// 音声コンテキスト開始（初回クリック時）
function startAudioContext() {
    if (game.musicEnabled) {
        audioManager.playBGM('title');
    }
}

// 音楽制御
function toggleMusic() {
    game.musicEnabled = !game.musicEnabled;
    const btn = document.getElementById('music-toggle');

    if (game.musicEnabled) {
        btn.textContent = '🎵';
        // 現在の画面に応じてBGMを再生
        if (game.currentScreen === 'title') {
            audioManager.playBGM('title');
        } else if (game.currentScreen === 'battle' || game.currentScreen === 'action') {
            audioManager.playBGM('battle');
        }
    } else {
        btn.textContent = '🔇';
        audioManager.stopBGM();
    }
}

function changeVolume(event) {
    const volume = parseFloat(event.target.value);
    audioManager.setVolume(volume);
}

// ストーリー画面を表示
function showStoryScreen() {
    const selectedStage = parseInt(document.getElementById('stage-selector').value);
    game.currentStage = selectedStage;

    console.log(`ストーリー画面表示 - ステージ${game.currentStage}`);
    hideAllScreens();
    document.getElementById('story-screen').classList.remove('hidden');
    game.currentScreen = 'story';

    // ステージに応じたストーリーを表示
    const storyText = document.getElementById('story-content');
    storyText.textContent = stageData[game.currentStage].story;

    // BGMは継続（タイトル画面と同じ）
}

// バトル画面を表示
function showBattleScreen() {
    console.log('バトル画面表示');
    hideAllScreens();
    document.getElementById('battle-screen').classList.remove('hidden');
    game.currentScreen = 'battle';

    // ステージデータを読み込み
    loadStageData();

    // バトルマップを作成
    createBattleMap();
    updateTurnDisplay();
    updatePlayerStatus();

    // バトルBGM再生
    if (game.musicEnabled) {
        audioManager.playBGM('battle');
    }
}

// ステージデータを読み込み
function loadStageData() {
    const currentStageData = stageData[game.currentStage];

    // ステージ名を表示
    document.getElementById('current-stage').textContent = currentStageData.name;

    // プレイヤーをリセット
    game.units.player = { x: 1, y: 4, hp: 120, maxHp: 120, symbol: '♠' };

    // 敵データをコピー
    game.units.enemies = currentStageData.enemies.map(enemy => ({...enemy}));

    // 機兵をクリア
    game.units.mechs = [];

    // ゲーム状態をリセット
    game.playerTurn = true;
    game.summonGauge = 0;
    game.selectedUnit = null;
    game.actionMode = 'none';
}

// アクション画面を表示
function showActionScreen() {
    console.log('アクション画面表示');
    hideAllScreens();
    document.getElementById('action-screen').classList.remove('hidden');
    game.currentScreen = 'action';

    // アクションゲーム初期化
    initActionGame();

    // BGMは継続（バトルBGMのまま）
}

// 結果画面を表示
function showResultScreen(isWin) {
    console.log('結果画面表示:', isWin ? '勝利' : '敗北');
    hideAllScreens();
    document.getElementById('result-screen').classList.remove('hidden');
    game.currentScreen = 'result';

    const title = document.getElementById('result-title');
    const text = document.getElementById('result-text');
    const victoryIcon = document.getElementById('victory-icon');
    const defeatIcon = document.getElementById('defeat-icon');
    const nextStageBtn = document.getElementById('next-stage-btn');

    // アイコンをリセット
    victoryIcon.classList.add('hidden');
    defeatIcon.classList.add('hidden');

    if (isWin) {
        title.textContent = '勝利！';
        title.style.color = '#4fc3f7';
        victoryIcon.classList.remove('hidden');
        
        if (game.currentStage < 10) {
            text.textContent = `${stageData[game.currentStage].name} クリア！`;
            nextStageBtn.classList.remove('hidden');
        } else {
            text.textContent = '世界樹に平和が戻った！全ステージクリア！';
            nextStageBtn.classList.add('hidden');
        }
        
        // 勝利BGM再生
        if (game.musicEnabled) {
            audioManager.playBGM('clear');
        }
        
        // レベルアップ効果音
        audioManager.playSE('levelup');
    } else {
        title.textContent = '敗北...';
        title.style.color = '#f44336';
        text.textContent = 'まだ修行が足りないようだ';
        defeatIcon.classList.remove('hidden');
        nextStageBtn.classList.add('hidden');
        
        // BGM停止
        audioManager.stopBGM();
        
        // 敗北効果音
        audioManager.playSE('hit');
    }
}

// 次のステージへ
function nextStage() {
    if (game.currentStage < 10) {
        game.currentStage++;
        document.getElementById('stage-selector').value = game.currentStage;
        showStoryScreen();
    }
}

// ゲーム再開
function restartGame() {
    showStoryScreen();
}

// タイトルに戻る
function returnToTitle() {
    console.log('タイトルに戻る');
    hideAllScreens();
    document.getElementById('title-screen').classList.remove('hidden');
    game.currentScreen = 'title';

    // アニメーション停止
    if (actionGame.animationId) {
        cancelAnimationFrame(actionGame.animationId);
        actionGame.animationId = null;
    }

    // タイトルBGM再生
    if (game.musicEnabled) {
        audioManager.playBGM('title');
    }
}

// 全ての画面を隠す
function hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.add('hidden'));
}

// バトルマップを作成
function createBattleMap() {
    const mapElement = document.getElementById('battle-map');
    mapElement.innerHTML = '';

    // 5x5のマスを作成
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const cell = document.createElement('div');
            cell.className = 'map-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.addEventListener('click', () => handleCellClick(x, y));
            
            // キャラクターを配置
            const content = getCellContent(x, y);
            cell.innerHTML = content.symbol;
            if (content.type) {
                cell.classList.add(content.type);
            }
            
            mapElement.appendChild(cell);
        }
    }
}

// セルの内容を取得
function getCellContent(x, y) {
    // プレイヤーの位置チェック
    if (game.units.player.x === x && game.units.player.y === y) {
        return { symbol: getPlayerSVG(), type: 'player' };
    }

    // 機兵の位置チェック
    for (let mech of game.units.mechs) {
        if (mech.x === x && mech.y === y && mech.hp > 0) {
            return { symbol: getMechSVG(), type: 'mech' };
        }
    }

    // 敵の位置チェック
    for (let enemy of game.units.enemies) {
        if (enemy.x === x && enemy.y === y && enemy.hp > 0) {
            return { symbol: getEnemySVG(enemy.type), type: enemy.type };
        }
    }

    return { symbol: '', type: null };
}

// プレイヤーSVGを取得
function getPlayerSVG() {
    return document.getElementById('player-svg').outerHTML;
}

// 機兵SVGを取得
function getMechSVG() {
    return document.getElementById('mech-svg').outerHTML;
}

// 敵SVGを取得
function getEnemySVG(enemyType) {
    switch(enemyType) {
        case 'goblin':
            return document.getElementById('goblin-svg').outerHTML;
        case 'orc':
            return document.getElementById('orc-svg').outerHTML;
        case 'skeleton':
            return document.getElementById('skeleton-svg').outerHTML;
        case 'behemoth':
            return document.getElementById('behemoth-svg').outerHTML;
        default:
            return '👹'; // デフォルト
    }
}

// セルクリックの処理
function handleCellClick(x, y) {
    if (!game.playerTurn) return;

    console.log(`セルクリック: (${x}, ${y}), モード: ${game.actionMode}`);

    if (game.actionMode === 'move') {
        handleMoveAction(x, y);
    } else if (game.actionMode === 'attack') {
        handleAttackAction(x, y);
    } else {
        // ユニット選択
        if (x === game.units.player.x && y === game.units.player.y) {
            selectUnit('player');
        }
    }
}

// 移動アクションの処理
function handleMoveAction(x, y) {
    const player = game.units.player;
    const distance = Math.abs(x - player.x) + Math.abs(y - player.y);

    if (distance <= 2 && !isOccupied(x, y)) {
        player.x = x;
        player.y = y;
        createBattleMap();
        setActionMode('none');
        audioManager.playSE('move');
        console.log(`プレイヤーが (${x}, ${y}) に移動`);
        
        // 移動後にプレイヤーのターン終了
        setTimeout(() => {
            game.playerTurn = false;
            updateTurnDisplay();
            processEnemyTurn();
        }, 500);
    }
}

// 攻撃アクションの処理
function handleAttackAction(x, y) {
    const player = game.units.player;
    const distance = Math.abs(x - player.x) + Math.abs(y - player.y);

    if (distance <= 1) {
        const enemy = getEnemyAt(x, y);
        if (enemy) {
            const damage = 50 + Math.floor(Math.random() * 30); // 50-80ダメージ（大幅強化）
            enemy.hp -= damage;
            console.log(`${enemy.name}に${damage}ダメージ！ 残りHP: ${enemy.hp}`);
            
            if (enemy.hp <= 0) {
                console.log(`${enemy.name}を倒した！`);
                game.summonGauge = Math.min(game.summonGauge + 1, 3);
                audioManager.playSE('levelup'); // 敵撃破時の効果音
            }
            
            audioManager.playSE('attack');
            createBattleMap();
            updateTurnDisplay();
            setActionMode('none');
            
            // 勝利判定
            if (game.units.enemies.every(e => e.hp <= 0)) {
                setTimeout(() => showResultScreen(true), 1000);
                return;
            }
            
            // プレイヤーのターン終了
            setTimeout(() => {
                game.playerTurn = false;
                updateTurnDisplay();
                processEnemyTurn();
            }, 1000);
        }
    }
}

// 行動モードを設定
function setActionMode(mode) {
    game.actionMode = mode;
    console.log(`行動モード変更: ${mode}`);

    // セルの表示を更新
    clearCellHighlights();

    if (mode === 'move') {
        highlightMovableCells();
    } else if (mode === 'attack') {
        highlightAttackableCells();
    }
}

// セルのハイライトをクリア
function clearCellHighlights() {
    const cells = document.querySelectorAll('.map-cell');
    cells.forEach(cell => {
        cell.classList.remove('movable', 'attackable', 'selected');
    });
}

// 移動可能セルをハイライト
function highlightMovableCells() {
    const player = game.units.player;

    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const distance = Math.abs(x - player.x) + Math.abs(y - player.y);
            if (distance <= 2 && !isOccupied(x, y)) {
                const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                cell.classList.add('movable');
            }
        }
    }
}

// 攻撃可能セルをハイライト
function highlightAttackableCells() {
    const player = game.units.player;

    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const distance = Math.abs(x - player.x) + Math.abs(y - player.y);
            if (distance <= 1 && isEnemyAt(x, y)) {
                const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                cell.classList.add('attackable');
            }
        }
    }
}

// 指定位置に敵がいるかチェック
function isEnemyAt(x, y) {
    return game.units.enemies.some(enemy => enemy.x === x && enemy.y === y && enemy.hp > 0);
}

// 指定位置の敵を取得
function getEnemyAt(x, y) {
    return game.units.enemies.find(enemy => enemy.x === x && enemy.y === y && enemy.hp > 0);
}

// 指定位置が占有されているかチェック
function isOccupied(x, y) {
    // プレイヤーがいる
    if (game.units.player.x === x && game.units.player.y === y) return true;

    // 敵がいる
    if (game.units.enemies.some(enemy => enemy.x === x && enemy.y === y && enemy.hp > 0)) return true;

    // 機兵がいる
    if (game.units.mechs.some(mech => mech.x === x && mech.y === y && mech.hp > 0)) return true;

    return false;
}

// ユニットを選択
function selectUnit(unitType) {
    game.selectedUnit = unitType;
    console.log(`ユニット選択: ${unitType}`);
}

// 機兵召喚モード開始
function startSummonMode() {
    if (game.summonGauge >= 3) {
        console.log('機兵召喚！');
        
        // 空いているセルを探して機兵を配置
        let mechPlaced = false;
        for (let y = 0; y < 5 && !mechPlaced; y++) {
            for (let x = 0; x < 5 && !mechPlaced; x++) {
                if (!isOccupied(x, y)) {
                    // 機兵を配置
                    game.units.mechs.push({
                        x: x,
                        y: y,
                        hp: 100,
                        maxHp: 100,
                        attack: 60,
                        name: '機兵リヴァント'
                    });
                    mechPlaced = true;
                    console.log(`機兵を(${x}, ${y})に配置`);
                }
            }
        }
        
        game.summonGauge = 0; // ゲージをリセット
        updateTurnDisplay();
        createBattleMap();
        audioManager.playSE('levelup'); // 召喚効果音
    }
}

// プレイヤーターン終了
function endPlayerTurn() {
    console.log('プレイヤーターン終了');
    game.playerTurn = false;
    setActionMode('none');
    updateTurnDisplay();

    // 敵のターン処理
    setTimeout(processEnemyTurn, 1000);
}

// 敵のターン処理
function processEnemyTurn() {
    console.log('敵のターン開始');

    // 生きている敵のみ処理
    const aliveEnemies = game.units.enemies.filter(enemy => enemy.hp > 0);

    // 各敵の行動処理
    for (let enemy of aliveEnemies) {
        processEnemyAction(enemy);
    }

    // 機兵の行動処理
    const aliveMechs = game.units.mechs.filter(mech => mech.hp > 0);
    for (let mech of aliveMechs) {
        processMechAction(mech);
    }

    createBattleMap();
    updatePlayerStatus();

    // プレイヤーターンに戻す
    setTimeout(() => {
        game.playerTurn = true;
        updateTurnDisplay();
    }, 1500);
}

// 敵の個別行動処理
function processEnemyAction(enemy) {
    const player = game.units.player;
    const distanceToPlayer = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);

    // 機兵への距離もチェック
    let targetDistance = distanceToPlayer;
    let target = player;

    for (let mech of game.units.mechs) {
        if (mech.hp > 0) {
            const distanceToMech = Math.abs(enemy.x - mech.x) + Math.abs(enemy.y - mech.y);
            if (distanceToMech < targetDistance) {
                targetDistance = distanceToMech;
                target = mech;
            }
        }
    }

    if (targetDistance <= 1) {
        // 攻撃
        const damage = 8 + Math.floor(Math.random() * 12); // 8-20ダメージ（弱体化）
        console.log(`${enemy.name}が${target.name || 'プレイヤー'}を攻撃！${damage}ダメージ`);
        target.hp -= damage;
        audioManager.playSE('hit');
        
        if (target === player && target.hp <= 0) {
            updatePlayerStatus();
            setTimeout(() => showResultScreen(false), 1000);
            return;
        }
    } else if (targetDistance > 1) {
        // 移動（ターゲットに近づく）
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        
        let newX = enemy.x;
        let newY = enemy.y;
        
        // ターゲットに近づく方向を決定
        if (Math.abs(dx) > Math.abs(dy)) {
            newX += dx > 0 ? 1 : -1;
        } else {
            newY += dy > 0 ? 1 : -1;
        }
        
        // 移動先が範囲内で、他のユニットがいない場合のみ移動
        if (newX >= 0 && newX < 5 && newY >= 0 && newY < 5 && !isOccupied(newX, newY)) {
            enemy.x = newX;
            enemy.y = newY;
            console.log(`${enemy.name}が (${newX}, ${newY}) に移動`);
        }
    }
}

// 機兵の行動処理
function processMechAction(mech) {
    // 最も近い敵を探す
    let nearestEnemy = null;
    let shortestDistance = Infinity;

    for (let enemy of game.units.enemies) {
        if (enemy.hp > 0) {
            const distance = Math.abs(mech.x - enemy.x) + Math.abs(mech.y - enemy.y);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestEnemy = enemy;
            }
        }
    }

    if (nearestEnemy) {
        if (shortestDistance <= 1) {
            // 攻撃
            const damage = mech.attack + Math.floor(Math.random() * 10); // 基本攻撃力 + ランダム
            nearestEnemy.hp -= damage;
            console.log(`${mech.name}が${nearestEnemy.name}を攻撃！${damage}ダメージ`);
            audioManager.playSE('attack');
            
            if (nearestEnemy.hp <= 0) {
                console.log(`${nearestEnemy.name}を撃破！`);
                game.summonGauge = Math.min(game.summonGauge + 1, 3);
            }
        } else {
            // 移動（敵に近づく）
            const dx = nearestEnemy.x - mech.x;
            const dy = nearestEnemy.y - mech.y;
            
            let newX = mech.x;
            let newY = mech.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                newX += dx > 0 ? 1 : -1;
            } else {
                newY += dy > 0 ? 1 : -1;
            }
            
            if (newX >= 0 && newX < 5 && newY >= 0 && newY < 5 && !isOccupied(newX, newY)) {
                mech.x = newX;
                mech.y = newY;
                console.log(`${mech.name}が (${newX}, ${newY}) に移動`);
            }
        }
    }
}

// ターン表示を更新
function updateTurnDisplay() {
    const turnInfo = document.getElementById('current-turn');
    const gaugeValue = document.getElementById('gauge-value');
    const summonBtn = document.getElementById('summon-btn');

    turnInfo.textContent = game.playerTurn ? 'プレイヤーのターン' : '敵のターン';
    gaugeValue.textContent = game.summonGauge;

    // 召喚ボタンの有効/無効
    if (game.summonGauge >= 3) {
        summonBtn.disabled = false;
        summonBtn.textContent = '機兵召喚 (可能)';
    } else {
        summonBtn.disabled = true;
        summonBtn.textContent = `機兵召喚 (${game.summonGauge}/3)`;
    }
}

// プレイヤーステータス更新
function updatePlayerStatus() {
    const playerHp = document.getElementById('player-hp');
    playerHp.textContent = Math.max(0, game.units.player.hp);

    // HPバーの色を変更
    const hpRatio = game.units.player.hp / game.units.player.maxHp;
    if (hpRatio > 0.5) {
        playerHp.style.color = '#4caf50';
    } else if (hpRatio > 0.2) {
        playerHp.style.color = '#ff9800';
    } else {
        playerHp.style.color = '#f44336';
    }
}

// アクションゲームの初期化
function initActionGame() {
    actionGame.canvas = document.getElementById('action-canvas');
    actionGame.ctx = actionGame.canvas.getContext('2d');

    // プレイヤーの初期位置
    actionGame.player = { x: 200, y: 150, size: 20, color: '#4fc3f7' };

    // 敵を3体生成
    actionGame.enemies = [];
    for (let i = 0; i < 3; i++) {
        actionGame.enemies.push({
            x: Math.random() * 360 + 20,
            y: Math.random() * 260 + 20,
            size: 15,
            color: '#f44336',
            hp: 2,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        });
    }

    updateEnemyCount();
    startActionGameLoop();
}

// アクションゲームのメインループ
function startActionGameLoop() {
    function gameLoop() {
        updateActionGame();
        drawActionGame();
        
        // 敵がすべて倒されたかチェック
        if (actionGame.enemies.length === 0) {
            endActionGame(true);
            return;
        }
        
        actionGame.animationId = requestAnimationFrame(gameLoop);
    }

    gameLoop();
}

// アクションゲームの更新
function updateActionGame() {
    const player = actionGame.player;
    const speed = 3;

    // プレイヤーの移動
    if (actionGame.keys['w'] || actionGame.keys['W']) player.y = Math.max(player.size, player.y - speed);
    if (actionGame.keys['s'] || actionGame.keys['S']) player.y = Math.min(300 - player.size, player.y + speed);
    if (actionGame.keys['a'] || actionGame.keys['A']) player.x = Math.max(player.size, player.x - speed);
    if (actionGame.keys['d'] || actionGame.keys['D']) player.x = Math.min(400 - player.size, player.x + speed);

    // 敵の移動
    actionGame.enemies.forEach(enemy => {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        
        // 壁で跳ね返る
        if (enemy.x <= enemy.size || enemy.x >= 400 - enemy.size) enemy.vx *= -1;
        if (enemy.y <= enemy.size || enemy.y >= 300 - enemy.size) enemy.vy *= -1;
        
        // 境界内に制限
        enemy.x = Math.max(enemy.size, Math.min(400 - enemy.size, enemy.x));
        enemy.y = Math.max(enemy.size, Math.min(300 - enemy.size, enemy.y));
    });
}

// アクションゲームの描画
function drawActionGame() {
    const ctx = actionGame.ctx;

    // 背景をクリア
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 400, 300);

    // プレイヤーを描画
    ctx.fillStyle = actionGame.player.color;
    ctx.beginPath();
    ctx.arc(actionGame.player.x, actionGame.player.y, actionGame.player.size, 0, Math.PI * 2);
    ctx.fill();

    // 敵を描画
    actionGame.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// アクションゲーム終了
function endActionGame(success) {
    if (actionGame.animationId) {
        cancelAnimationFrame(actionGame.animationId);
        actionGame.animationId = null;
    }

    if (success) {
        console.log('アクションゲーム成功');
        audioManager.playSE('levelup');
        // バトル画面に戻る
        setTimeout(() => {
            showBattleScreen();
            // 敵を全滅させる
            game.units.enemies.forEach(enemy => enemy.hp = 0);
            createBattleMap();
            setTimeout(() => showResultScreen(true), 1000);
        }, 1000);
    } else {
        console.log('アクションゲーム失敗');
        audioManager.playSE('hit');
        showBattleScreen();
    }
}

// 敵数の更新
function updateEnemyCount() {
    document.getElementById('enemy-count').textContent = actionGame.enemies.length;
}

// 攻撃処理
function performAttack() {
    const player = actionGame.player;
    const attackRange = 40;

    // 攻撃範囲内の敵をチェック
    for (let i = actionGame.enemies.length - 1; i >= 0; i--) {
        const enemy = actionGame.enemies[i];
        const distance = Math.sqrt(
            Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
        );
        
        if (distance <= attackRange) {
            enemy.hp--;
            audioManager.playSE('attack');
            
            if (enemy.hp <= 0) {
                actionGame.enemies.splice(i, 1);
                updateEnemyCount();
            }
        }
    }
}

// 回転斬り攻撃
function performSpinAttack() {
    const player = actionGame.player;
    const attackRange = 60;

    // より広範囲の攻撃
    for (let i = actionGame.enemies.length - 1; i >= 0; i--) {
        const enemy = actionGame.enemies[i];
        const distance = Math.sqrt(
            Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
        );
        
        if (distance <= attackRange) {
            enemy.hp = 0; // 一撃で倒す
            actionGame.enemies.splice(i, 1);
            audioManager.playSE('attack');
            updateEnemyCount();
        }
    }
}

// キーボード操作
function handleKeyDown(event) {
    actionGame.keys[event.key] = true;

    if (game.currentScreen === 'action') {
        if (event.key === 'j' || event.key === 'J') {
            performAttack();
        } else if (event.key === 'k' || event.key === 'K') {
            performSpinAttack();
        }
    }
}

function handleKeyUp(event) {
    actionGame.keys[event.key] = false;
}

// スマホ用コントローラー設定
function setupMobileControls() {
    // 移動ボタン
    document.querySelectorAll('.move-btn').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const key = btn.dataset.key;
            actionGame.keys[key] = true;
        });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            const key = btn.dataset.key;
            actionGame.keys[key] = false;
        });
    });

    // アクションボタン
    document.querySelectorAll('.action-key').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const key = btn.dataset.key;
            
            if (game.currentScreen === 'action') {
                if (key === 'j') {
                    performAttack();
                } else if (key === 'k') {
                    performSpinAttack();
                }
            }
        });
    });
}