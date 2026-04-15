// 想知道你的 脚本/机器 刷经验的速度吗?
// Aurelium Skills 经验速率统计脚本
// 按键触发打开脚本
// 此脚本获取上方boss栏提示的信息，存10组数据，计算当前刷经验速度
// 运行中途改窗口大小会让文本渲染没掉，我也不知道为啥
// By Bi_Diu & ChatGPT
// 自用脚本，请勿倒卖

const enableTimeout = true  // 是否在长时间无经验提示时重置显示为N/A
const timeoutTime = 60000   // 60s=60000ms

const posX = 100;           // 文字 X 坐标 (左上角为0, 0)
const posY = 50;            // 文字 Y 坐标 (左上角为0, 0)
const textSize = 1.0;       // 字体大小
const lineSpacing = 3;      // 每行字间隔

// 不用改
const lineHeight = 10;      // 每行字本体高度，不用调
let draw2d = Hud.createDraw2D();
let rectElement = null;     // 背景矩形
let titleElement = null;    // 标题文本

const scriptName = "技能升级效率统计";
const enabled = GlobalVars.toggleBoolean(scriptName);
if (!enabled) {
    Chat.log(Chat.createTextBuilder().append("[").withColor(0x7).append(scriptName).withColor(0xb)
        .append("]").withColor(0x7).append(" Disabled").withColor(0x4).build());
    JsMacros.disableAllListeners("Bossbar");
    Hud.clearDraw2Ds();
    draw2d.unregister();
} else {
    Chat.log(Chat.createTextBuilder().append("[").withColor(0x7).append(scriptName).withColor(0xb)
        .append("]").withColor(0x7).append(" Enabled").withColor(0x2).build());
}

// 保存每个技能对应的 textElement
let skillTexts = {};
let skillStats = {};

if (GlobalVars.getBoolean(scriptName)) {
    JsMacros.on("Bossbar", JavaWrapper.methodToJava((bar) => {
        if (bar.bossBar?.getName().getString()?.includes("魔法商店上新")) return;
        if (bar.bossBar?.getName().getString()?.includes("秒")) return;
        if (bar.type === "ADD") return;

        if (bar.type === "UPDATE_NAME") {
            let bossbarStr = bar.bossBar?.getName().getString();
            const regex = /\+([\d.]+)\s+(\S+)\s+经验\s+\(([\d.]+)%\)/;
            let match = regex.exec(bossbarStr);
            if (match) {
                let gain = parseFloat(match[1]);     // 本次增加的经验
                let skillName = match[2];            // 技能名
                let percent = parseFloat(match[3]);  // 当前百分比

                let now = Time.time();

                if (!skillStats[skillName]) {
                    skillStats[skillName] = { samples: [], lastUpdate: now };
                }

                // 保存样本
                skillStats[skillName].samples.push([now, gain, percent]);
                skillStats[skillName].lastUpdate = now;

                if (skillStats[skillName].samples.length > 10) {
                    skillStats[skillName].samples.shift();
                }

                // 更新 HUD
                updateSkillDisplay(skillName);
                updateRectDisplay();
            }
        }
    }));
}

// 更新某个技能的显示
function updateSkillDisplay(skillName) {
    let stats = skillStats[skillName];
    let now = Time.time();

    let displayText;
    if (!stats || stats.samples.length < 2) {
        displayText = `§a${skillName}:  §rN/A`;
    } else {
        // 取最新样本
        let latest = stats.samples[stats.samples.length - 1];
        let nowPercent = latest[2];

        // 计算平均速度
        let first = stats.samples[0];
        let last = latest;
        let dt = (last[0] - first[0]) / 1000;

        let avgExpPerSec = 0;
        let avgPercentPerSec = 0;
        if (dt > 0) {
            let totalGain = stats.samples
                .slice(1)
                .map(s => s[1])
                .reduce((a, b) => a + b, 0);
            avgExpPerSec = totalGain / dt;
            avgPercentPerSec = (last[2] - first[2]) / dt;
        }

        let expPerMin = avgExpPerSec * 60;
        let remainPercent = 100 - nowPercent;
        let secToLevel = avgPercentPerSec > 0 ? remainPercent / avgPercentPerSec : Infinity;

        displayText = `§a§n${skillName}§r:  ` +
            `§r§3${avgExpPerSec.toFixed(2)}/s §f|§b ${expPerMin.toFixed(1)}/min §f| ` +
            `§r§d升级剩余: §c${secToLevel === Infinity ? "N/A" : secToLevel.toFixed(1) + "s"}`;
    }

    // 行位置计算
    let index = Object.keys(skillStats).indexOf(skillName) + 1;
    let y = posY + index * ((lineHeight * textSize) + lineSpacing);
    if (index > 0) y += 3;

    if (!skillTexts[skillName]) {
        skillTexts[skillName] = draw2d.addText(
            displayText,
            posX,
            y,
            0xFFFFFF,
            true,
            textSize,
            0
        );
    } else {
        skillTexts[skillName].setText(displayText);
    }
}


// 更新背景矩形
function updateRectDisplay() {
    let keys = Object.keys(skillTexts);
    let totalLines = keys.length + 1;
    let totalHeight = totalLines * (lineHeight * textSize) + ((totalLines - 1) * lineSpacing);
    if (keys.length > 0) totalHeight += 3;

    let maxWidth = titleElement ? titleElement.getWidth() * textSize : 0;
    for (let k of keys) {
        let w = skillTexts[k].getWidth() * textSize;
        if (w > maxWidth) maxWidth = w;
    }

    if (rectElement) draw2d.removeElement(rectElement);
    rectElement = draw2d.addRect(
        posX - 3, posY - 4,
        posX + maxWidth + 3,
        posY + totalHeight + 1,
        0x000000, 128, 0, 0
    );
}


// 初始化
draw2d.setOnInit(JavaWrapper.methodToJava(() => {
    titleElement = draw2d.addText(
        `§e--- §6${scriptName}§e ---`,
        posX, posY, 0xFFFFFF, true, textSize, 0
    );
    rectElement = draw2d.addRect(
        posX - 3, posY - 3,
        posX + (titleElement.getWidth() * textSize) + 3,
        posY + (lineHeight * textSize) + 1,
        0x000000, 128, 0, 0
    );
}));
if (GlobalVars.getBoolean(scriptName)) draw2d.register();

// 定时更新
function refreshSkills() {
    let now = Time.time();

    for (let skillName in skillStats) {
        let stats = skillStats[skillName];

        // 超过 30s 没更新 → 清空并显示 N/A
        if (now - stats.lastUpdate > timeoutTime) {
            stats.samples = [];
        }

        updateSkillDisplay(skillName);
    }

    updateRectDisplay(); // 重新调整背景大小
}
while (enableTimeout && GlobalVars.getBoolean(scriptName)) {
    refreshSkills();
    Client.waitTick(20);
}
