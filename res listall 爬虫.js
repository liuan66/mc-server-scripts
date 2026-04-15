// 用于hyt关服存信息
// 也不知道这有啥用，但是想写就写了
// 发出来供大家参考
// 搞缓冲区是因为领地列表每条消息出来的间隔太短，有时会乱序
// 通过检测页面结尾标记来触发排序输出
// Bi_Diu & Claude

const server = "HYT 仙境3区"
const START_PAGE = 1;
const END_PAGE = 1465;
const cmdInterval = 500;  // 命令间隔时间，单位毫秒

let currentPage = START_PAGE;

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
let currentLogLevel = LOG_LEVELS.info;
const logPrefix = "[§eRLAS§f] ";

const scriptname = "res领地列表爬虫"
const reverse = !GlobalVars.getBoolean(scriptname);
GlobalVars.putBoolean(scriptname, reverse);
if (reverse) {
    Chat.log(`§7[§b${scriptname}§7] §2Enabled`);
} else {
    Chat.log(`§7[§b${scriptname}§7] §4Disabled`);
    JsMacros.disableScriptListeners();
}

function isEnabled() {
    return GlobalVars.getBoolean(scriptname);
}

const logging = true;
function log(msg, level = "info") {
    if (!Player.getPlayer()) { Client.waitTick(1); return; }
    if (!logging) return;
    const lvl = LOG_LEVELS[level] ?? LOG_LEVELS.info;
    if (lvl < currentLogLevel) return;

    let prefix = logPrefix;
    let color = "§7";
    if (level === "warn") color = "§e";
    if (level === "error") color = "§c";
    if (level === "debug") color = "§8";

    Chat.log(`${prefix}${color}[${level.toUpperCase()}]§r ${msg}`);
}

let txt = FS.open(`${server} page ${START_PAGE}-${END_PAGE}.txt`);
// let sortedTxt = FS.open(`RLA ${server} SORTED.txt`);  // 排序后的输出文件
let entryBuffer = {};  // 按索引号缓存条目：{ 1: {...}, 2: {...}, ... }
let maxIndexReceived = 0;  // 记录收到的最大索引号

function write(str) {
    txt.append(str)
}

function safeSleep(time) {
    let elapsed = 0;
    while (elapsed < time) {
        if (!isEnabled()) {
            return;
        }
        elapsed += 50;
        Time.sleep(50);
    }
}

// function writeSorted(str) {
//     sortedTxt.append(str)
// }

if (isEnabled()) {
    const MessageListener = JsMacros.on("RecvMessage", JavaWrapper.methodToJava((msg) => {
        if (!Player.getPlayer()) { Client.waitTick(1); return; }
        const str = msg.text.getString();
        if (str.includes(logPrefix)) return;
        const cleanStr = stripColors(str);

        // 检测页面结尾标记（包含"上一页"或"下一页"的分割线）
        if ((cleanStr.includes("上一页") && cleanStr.includes("下一页")) || (cleanStr.includes("Prev") && cleanStr.includes("Next"))) {
            log(`检测到页面标记，触发排序输出`, "debug");
            // setTimeout(() => flushSortedEntries(), 500);  // 延迟 500ms 确保所有消息已到达
            safeSleep(500);
            flushSortedEntries()
            log(`准备请求下一页，当前页码 ${currentPage}`, "info");
            safeSleep(cmdInterval)

            // Chat.say(".clear-chat")

            if (!isEnabled()) return;
            if (!Player.getPlayer()) { Client.waitTick(1); return; }
            currentPage++;
            if (currentPage > END_PAGE) {
                log(`已处理完所有页码，禁用脚本`, "info");
                JavaWrapper.stop()
            }
            log(`发送领地列表命令，页码 ${currentPage}`, "info");
            Chat.say(`/res listall ${currentPage}`);
            return;
        }

        // 用正则判断：是否以可选空格开头，然后是一个或多个数字，再跟一个点
        const entryPattern = /^\s*(\d+)\./;
        const match = entryPattern.exec(cleanStr);
        if (!match) {
            log(`跳过非条目行: ${cleanStr.slice(0, 50)}...`, "debug");
            return;
        }

        const index = parseInt(match[1], 10);
        maxIndexReceived = Math.max(maxIndexReceived, index);
        log(`匹配到领地条目 #${index}`, "debug");

        let json = msg.text.getJson()
        let jsonObj = JSON.parse(json);

        let hoverEvent = jsonObj?.extra[0]?.hoverEvent?.contents?.extra;

        // 提取并清理 hover 内容，缓存到 entryBuffer
        try {
            log(`开始提取领地 #${index} 的 hover 内容`, "debug");
            const titleLine = stripColors(str).replace(/^\s+/gm, '').trim();

            // 提取 TP 和 MOVE 权限状态
            const permissionStatus = extractPermissions(str);
            log(`领地 #${index} 权限状态: TP=${permissionStatus.tp}, MOVE=${permissionStatus.move}`, "debug");

            const raw = extractTextFromHover(hoverEvent);
            const cleaned = stripColors(raw).replace(/^\s+/gm, '').trim();

            entryBuffer[index] = {
                title: titleLine,
                permissions: permissionStatus,
                info: cleaned
            };

            log(`成功缓存领地 #${index}，现有缓存数: ${Object.keys(entryBuffer).length}`, "debug");
            log(`领地信息内容(前100字): ${cleaned.slice(0, 100)}...`, "debug");
        } catch (e) {
            log(`提取领地 #${index} 出错: ${e}`, "error");
        }
    }));
}

// 从 hoverEvent contents.extra 递归提取文本（处理嵌套结构）
function extractTextFromHover(extra) {
    if (!extra) return '';
    if (typeof extra === 'string') return extra;

    if (Array.isArray(extra)) {
        return extra.map(part => extractTextFromHover(part)).join('');
    }

    if (typeof extra === 'object') {
        let result = '';
        // 优先取 text 字段
        if (typeof extra.text === 'string') {
            result += extra.text;
        }
        // 再递归处理 extra 字段
        if (Array.isArray(extra.extra)) {
            result += extractTextFromHover(extra.extra);
        }
        return result;
    }

    return '';
}

function stripColors(s) {
    return s.replace(/§[0-9a-fk-or]/gi, '');
}

// 从原始字符串中提取 T (TP) 和 M (MOVE) 的权限状态
function extractPermissions(str) {
    // 匹配 §[颜色]T 和 §[颜色]M 的格式
    const tpMatch = str.match(/§([0-9a-fk-or])T/i);
    const moveMatch = str.match(/§([0-9a-fk-or])M/i);

    // §2 为绿色（开），§4 为红色（关）
    const tpStatus = tpMatch ? (tpMatch[1] === '2' ? '开' : '关') : '未知';
    const moveStatus = moveMatch ? (moveMatch[1] === '2' ? '开' : '关') : '未知';

    return {
        tp: tpStatus,
        move: moveStatus
    };
}

// 格式化权限显示
function formatPermissions(perms) {
    const tpStr = perms.tp
    const moveStr = perms.move
    return `权限状态: TP:${tpStr} MOVE:${moveStr}`;
}

// 按索引号排序输出缓冲区中的所有条目
function flushSortedEntries() {
    const indices = Object.keys(entryBuffer)
        .map(k => parseInt(k, 10))
        .sort((a, b) => a - b);

    log(`开始排序输出，缓冲区中共有 ${indices.length} 条领地记录`, "debug");

    if (indices.length === 0) {
        log(`缓冲区为空，无法输出`, "warn");
        return;
    }

    log(`排序后的索引号: [${indices.join(', ')}]`, "debug");

    write(`========== 领地列表 (第 ${currentPage}/${END_PAGE} 页) ==========\n\n`);

    let successCount = 0;
    for (let idx of indices) {
        const entry = entryBuffer[idx];
        log(`输出领地 #${idx}: "${entry.title.slice(0, 50)}..."`, "debug");
        write(`${entry.title}\n`);
        write(`${formatPermissions(entry.permissions)}\n`);
        write(`${entry.info}\n`);
        write(`\n`);
        successCount++;
    }

    log(`成功输出 ${successCount} 条排序后的领地信息到文件`, "debug");

    // 清空缓冲区，准备下一页
    entryBuffer = {};
    maxIndexReceived = 0;
    log(`缓冲区已清空，准备接收下一页数据`, "info");
}



if (isEnabled()) {
    log(`从 ${currentPage} 页开始获取领地列表`, "info");
    Chat.say(`/res listall ${currentPage}`);
}