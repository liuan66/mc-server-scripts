const FishingPhase = {
    WAITING_HOOK: 'waiting_hook',
    HOOKED_PROMPT: 'hooked_prompt',
    KEY_CONFIRMED: 'key_confirmed',
    ACCURATE_CLICK_GAME: 'accurate_click_game',
    ACCURATE_CLICK_COLOR_GAME: 'accurate_click_color_game',
    ACCURATE_CLICK_GAMEV3: 'accurate_click_gamev3',
    CATCH_GAME: 'catch_game',
    TENSION_GAME: 'tension_game'
}

const spaceHeightMap = new Map([
    ['\uf801', -1],
    ['\uf802', -2],
    ['\uf803', -4],
    ['\uf804', -8],
    ['\uf805', -16],
    ['\uf806', -32],
    ['\uf807', -64],
    ['\uf808', -128],
    ['\uf811', 1],
    ['\uf812', 2],
    ['\uf813', 4],
    ['\uf814', 8],
    ['\uf815', 16],
    ['\uf816', 32],
    ['\uf817', 64],
    ['\uf818', 128]
])

const gameConfigs = [
    {
        barIcon: '뀋',
        pointer: '뀁',
        name: '精准点击v1-颜色',
        phase: FishingPhase.ACCURATE_CLICK_COLOR_GAME,
        offset: -119,
        colorMap: {
            '红色!': 1,
            '橙色!': 2,
            '黄色!': 3,
            '绿色!': 4,
            '浅蓝色!': 5,
            '深蓝色!': 6,
            '紫色!': 7
        },
        widthPerSection: 16
    },
    {
        barIcon: '뀂',
        pointer: '뀁',
        name: '精准点击v1_1',
        phase: FishingPhase.ACCURATE_CLICK_GAME,
        index: 6,
        offset: -183,
        widthPerSection: 16
    },
    {
        barIcon: '뀃',
        pointer: '뀁',
        name: '精准点击v1_2',
        phase: FishingPhase.ACCURATE_CLICK_GAME,
        index: 4,
        offset: -183,
        widthPerSection: 16
    },
    {
        barIcon: '뀄',
        pointer: '뀁',
        name: '精准点击v1_3',
        phase: FishingPhase.ACCURATE_CLICK_GAME,
        index: 8,
        offset: -183,
        widthPerSection: 16
    },
    {
        barIcon: '뀅',
        pointer: '뀁',
        name: '精准点击v1_4',
        phase: FishingPhase.ACCURATE_CLICK_GAME,
        index: [11, 17],
        offset: -183,
        widthPerSection: 8
    },
    {
        barIcon: '뀆',
        pointer: '뀁',
        name: '精准点击v1_5',
        phase: FishingPhase.ACCURATE_CLICK_GAME,
        index: [1, 8, 14, 18],
        offset: -183,
        widthPerSection: 8
    },
    {
        barIcon: '뀇',
        pointer: '뀁',
        name: '精准点击v1_6',
        phase: FishingPhase.ACCURATE_CLICK_GAME,
        index: [9, 11, 13],
        offset: -183,
        widthPerSection: 8
    },
    {
        barIcon: '뀈',
        pointer: '뀁',
        name: '精准点击v1_7',
        phase: FishingPhase.ACCURATE_CLICK_GAME,
        index: 39,
        offset: -183,
        widthPerSection: 4
    },
    {
        barIcon: '뀉',
        pointer: '뀁',
        name: '精准点击v1_8',
        phase: FishingPhase.ACCURATE_CLICK_GAME,
        index: 21,
        offset: -183,
        widthPerSection: 4
    },
    {
        barIcon: '뀊',
        pointer: '뀁',
        name: '精准点击v1_9',
        phase: FishingPhase.ACCURATE_CLICK_GAME,
        index: [1, 44],
        offset: -183,
        widthPerSection: 4
    },
    {
        barIcon: '뀌',
        pointer: '뀁',
        judgmentArea: '뀒',
        name: '抓住游戏1',
        phase: FishingPhase.CATCH_GAME,
        judgmentAreaWidth: 45,
        pointAreaWidth: 5
    },
    {
        barIcon: '뀌',
        pointer: '뀁',
        judgmentArea: '뀓',
        name: '抓住游戏3',
        phase: FishingPhase.CATCH_GAME,
        judgmentAreaWidth: 36,
        pointAreaWidth: 5
    },
    {
        barIcon: '뀌',
        pointer: '뀁',
        judgmentArea: '뀔',
        name: '精准点击v3',
        phase: FishingPhase.ACCURATE_CLICK_GAMEV3,
        judgmentAreaWidth: 27,
        pointAreaWidth: 5
    },
    {
        barIcon: '뀑',
        pointer: '뀍',
        name: '拉紧',
        phase: FishingPhase.TENSION_GAME
    }
]
class Title {
    constructor() {
        this.title = Chat.createTextHelperFromString('')
        this.subtitle = Chat.createTextHelperFromString('')
        this.actionBar = Chat.createTextHelperFromString('')
        this.listener = JsMacros.on(
            'Title',
            JavaWrapper.methodToJava((e) => {
                // FS.open('fish.txt').append(e.message.getString() + '\n')
                if (e.type === 'TITLE') {
                    this.title = e.message
                } else if (e.type === 'SUBTITLE') {
                    this.subtitle = e.message
                } else if (e.type === 'ACTIONBAR') {
                    this.actionBar = e.message
                }
            })
        )
        Chat.log('§a初始化标题监听')
    }
    reset() {
        this.title = Chat.createTextHelperFromString('')
        this.subtitle = Chat.createTextHelperFromString('')
        this.actionBar = Chat.createTextHelperFromString('')
    }
    getTitle() {
        return this.title
    }
    getSubtitle() {
        return this.subtitle
    }
    getActionBar() {
        return this.actionBar
    }
}
let CONFIG = {}
let actionKey = ''
let currentPhase = FishingPhase.WAITING_HOOK
const titleObj = new Title()
function calcActionKey() {
    calcActionKey.count ??= 0
    if (actionKey) {
        return
    }
    // 计算超时随机按下
    calcActionKey.count += 1
    if (calcActionKey.count > 5) {
        // 尝试按shift
        Chat.log('§a尝试按shift')
        const last = titleObj.getSubtitle()
        KeyBind.pressKey('key.keyboard.left.shift')
        Client.waitTick()
        KeyBind.releaseKey('key.keyboard.left.shift')

        Client.waitTick()
        const newSub = titleObj.getSubtitle()
        if (last !== newSub) {
            actionKey = '左Shift'
            calcActionKey.count = 0
            return
        }

        // 尝试attack
        const last2 = titleObj.getSubtitle()
        Chat.log('§a尝试按attack')
        KeyBind.pressKey('key.mouse.left')
        Client.waitTick()
        KeyBind.releaseKey('key.mouse.left')

        Client.waitTick()
        const newSub2 = titleObj.getSubtitle()
        if (last2 !== newSub2) {
            actionKey = '左键'
            calcActionKey.count = 0
            return
        }
    }
    const title = titleObj.getTitle()
    const match = /按下\s+(.+?)\s+开始/.exec(title.getString())
    if (match) {
        Chat.log(`§a开始游戏: ${match[1]}`)
        if (match[1] === '左Shift') {
            KeyBind.pressKey('key.keyboard.left.shift')
            Client.waitTick()
            KeyBind.releaseKey('key.keyboard.left.shift')
        } else if (match[1] === '左键') {
            KeyBind.pressKey('key.mouse.left')
            Client.waitTick()
            KeyBind.releaseKey('key.mouse.left')
        }
        calcActionKey.count = 0
        actionKey = match[1]
    }
}
function handleTensionGame() {
    const titleStr = titleObj.getTitle()
    const messageStr = titleStr.getString()
    calcActionKey()
    if (!actionKey) {
        return
    }
    if (messageStr === '뀙' || messageStr === '뀘' || messageStr === '뀗') {
        // 松开
        KeyBind.releaseKey('key.keyboard.left.shift')
    }
    if (messageStr === '뀑') {
        // 按下
        KeyBind.pressKey('key.keyboard.left.shift')
    }
}
function handleAccurateClickGameV3() {
    const subtitle = titleObj.getSubtitle()
    const data = JSON.parse(subtitle.getJson())
    if (!data.extra?.[3]) {
        return
    }
    const pointOffset = calculateCumulativeOffset(data.extra[3])
    const leftBound = -CONFIG.judgmentAreaWidth
    const rightBound = -CONFIG.pointAreaWidth
    if (pointOffset > leftBound && pointOffset < rightBound) {
        const player = Player.getPlayer()
        player.interact()
        currentPhase = FishingPhase.WAITING_HOOK
    }
}
function hanldeCatchGame() {
    calcActionKey()
    if (!actionKey) {
        return
    }
    // 获取judgment的偏移
    const subtitle = titleObj.getSubtitle()
    const data = JSON.parse(subtitle.getJson())
    if (!data.extra?.[3]) {
        return
    }
    const pointOffset = calculateCumulativeOffset(data.extra[3])
    // 左边界和有边界
    const leftBound = -CONFIG.judgmentAreaWidth
    const rightBound = -CONFIG.pointAreaWidth
    const midLeft = leftBound + 10
    const midRight = rightBound - 10
    if (pointOffset < midLeft && actionKey === '左键') {
        Player.getPlayer().attack()
    }
    if (actionKey === '左Shift') {
        if (pointOffset > leftBound && pointOffset < rightBound) {
            Client.waitTick()
            KeyBind.pressKey('key.keyboard.left.shift')
            Client.waitTick()
            KeyBind.releaseKey('key.keyboard.left.shift')
            Time.sleep(100)
        } else {
            Client.waitTick()
            KeyBind.pressKey('key.keyboard.left.shift')
            Time.sleep(700)
            KeyBind.releaseKey('key.keyboard.left.shift')
            Time.sleep(500)
        }
    }
}
function handleGameConfirmed() {
    const subtitle = titleObj.getSubtitle()
    const messageStr = subtitle.getString()
    const data = JSON.parse(subtitle.getJson())
    for (const config of gameConfigs) {
        if (messageStr.includes(config.barIcon) && messageStr.includes(config.pointer)) {
            if (data.extra?.length === 6 && !messageStr.includes(config.judgmentArea)) {
                continue
            }
            // 如果是精确点击3有二义性
            CONFIG = config
            if (config.name === '精准点击v3') {
                const title = titleObj.getTitle()
                if (title.getString() === '按下 左Shift 开始') {
                    currentPhase = FishingPhase.CATCH_GAME
                    CONFIG.name = '抓住游戏2'
                } else {
                    currentPhase = FishingPhase.ACCURATE_CLICK_GAMEV3
                }
            } else {
                currentPhase = CONFIG.phase
            }
            Chat.log(`§a当前游戏: ${CONFIG.name}`)
            return
        }
    }
}
function calcClickIndex() {
    if (CONFIG.index) {
        return
    }
    const title = titleObj.getTitle()
    const key = title.getString()
    if (CONFIG.colorMap[key]) {
        Chat.log(`§a本次需要点击颜色: ${key}`)
        CONFIG.index = CONFIG.colorMap[key]
    }
}

function handleAccurateClickGame() {
    calcClickIndex()
    if (CONFIG.index === undefined) {
        return
    }
    const subtitle = titleObj.getSubtitle()
    const data = JSON.parse(subtitle.getJson())
    if (!data.extra?.[1]) {
        return
    }
    const cOffset = calculateCumulativeOffset(data.extra[1])
    const dist = Math.abs(cOffset - CONFIG.offset)
    const index = Math.ceil(dist / CONFIG.widthPerSection)
    const indexAry = typeof CONFIG.index === 'number' ? [CONFIG.index] : CONFIG.index
    if (indexAry.includes(index)) {
        const player = Player.getPlayer()
        player.interact()
        currentPhase = FishingPhase.WAITING_HOOK
    }
}

function calculateCumulativeOffset(part) {
    let total = 0
    for (let char of part.text) {
        const val = spaceHeightMap.get(char)
        if (val !== undefined) total += val
    }

    return total
}
// 失败消息
// ===================== 【优化1】改成关键词匹配，不管服务器发什么，只要包含关键词就触发 =====================
const failKeywords = ['escaped', '跑了', '挣脱', '失败']
const successKeywords = ['GG', 'Good', '成功', '钓到', '获得']

// 全局监听（防止重复绑定）
let titleListener = null
// 全局超时标记（用循环计时替代setTimeout，100%兼容1.9.2）
let gameTimeoutFlag = false
let gameStartTime = 0

// 全局配置
const FISH_TIMEOUT = 30000; // 30秒不上钩自动抛竿
let lastCastTime = 0;      // 记录最后一次抛竿时间

// 【100%兼容1.9.2】强制重置所有状态 + 自动抛竿
function resetAndRecast() {
    if(titleListener) {titleListener.off(); titleListener = null}
    gameTimeoutFlag = false
    gameStartTime = 0
    lastCastTime = Date.now();
    
    currentPhase = FishingPhase.WAITING_HOOK
    actionKey = ''
    CONFIG = {}
    titleObj.reset()
    
    Chat.log('§a[重置完成] 1秒后自动抛竿...')
    Time.sleep(1000)
    const player = Player.getPlayer()
    if(player) {
        player.interact()
        Chat.log('§a[自动抛竿] 新一轮钓鱼开始 ✅')
    }
}

// ===================== 【优化2】新增通用检测函数，同时检测标题/副标题/动作栏，关键词匹配 =====================
function checkGameEnd() {
    const t = titleObj.getTitle().getString().trim()
    const s = titleObj.getSubtitle().getString().trim()
    const a = titleObj.getActionBar().getString().trim()
    // 检测所有位置的关键词
    for(let k of successKeywords) {
        if(t.includes(k) || s.includes(k) || a.includes(k)) {
            Chat.log('§a[检测到胜利] 立刻结束')
            return true
        }
    }
    for(let k of failKeywords) {
        if(t.includes(k) || s.includes(k) || a.includes(k)) {
            Chat.log('§c[检测到失败] 立刻结束')
            return true
        }
    }
    return false
}

function main() {
    let flag = false
    // 先清旧监听再绑定
    if(titleListener) {titleListener.off(); titleListener = null}
    
    titleListener = JsMacros.on('Title', JavaWrapper.methodToJava((e) => {
        const msg = e.message.getString().trim()
        // 事件监听也用关键词匹配
        for(let k of successKeywords) {
            if(msg.includes(k)) {
                flag = true
                Chat.log('§a[事件检测到胜利]')
                return
            }
        }
        for(let k of failKeywords) {
            if(msg.includes(k)) {
                flag = true
                Chat.log('§c[事件检测到失败]')
                return
            }
        }
    }))

    // ===================== 【优化3】超时改成5000ms，3秒没完成基本就结束了，5秒兜底足够 =====================
    gameStartTime = Date.now()
    gameTimeoutFlag = false

    while (!flag && !gameTimeoutFlag) {
        // 5秒超时兜底
        if(Date.now() - gameStartTime > 5000) {
            gameTimeoutFlag = true
            Chat.log('§c[5秒超时] 强制重置')
            flag = true
        }

        // 【优化4】每5ms调用一次通用检测函数，覆盖所有消息位置，100%不会漏
        if(checkGameEnd()) flag = true;

        // 小游戏逻辑（完全不动，原样保留）
        switch (currentPhase) {
            case FishingPhase.HOOKED_PROMPT: handleGameConfirmed(); break
            case FishingPhase.ACCURATE_CLICK_GAME: handleAccurateClickGame(); break
            case FishingPhase.ACCURATE_CLICK_COLOR_GAME: handleAccurateClickGame(); break
            case FishingPhase.CATCH_GAME: hanldeCatchGame(); break
            case FishingPhase.ACCURATE_CLICK_GAMEV3: handleAccurateClickGameV3(); break
            case FishingPhase.TENSION_GAME: handleTensionGame(); break
        }
        Time.sleep(5)
    }

    resetAndRecast()
}

// 外层无限循环（完全不动，原有能运行的逻辑全保留）
while (true) {
    try {
        const player = Player.getPlayer()
        if(!player) {Time.sleep(500); continue}
        const bobber = player.getFishingBobber()

        if (currentPhase === FishingPhase.WAITING_HOOK) {
            if (bobber && bobber.hasCaughtFish()) {
                Chat.log('§a[上钩！] 开始小游戏')
                player.interact()
                currentPhase = FishingPhase.HOOKED_PROMPT
                main()
            }
            if(!bobber){
                Chat.log('§a[准备] 抛竿中...')
                player.interact()
                lastCastTime = Date.now();
                Time.sleep(800)
            }
            if(bobber && !bobber.hasCaughtFish() && Date.now() - lastCastTime > FISH_TIMEOUT){
                Chat.log('§c[30秒未上钩] 自动重新抛竿');
                resetAndRecast();
            }
        }
        Time.sleep(100)
    } catch (err) {
        Chat.log(`§c[异常] 自动恢复：${err}`)
        resetAndRecast()
        Time.sleep(1000)
    }
}