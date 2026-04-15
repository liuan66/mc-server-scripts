/* eslint-disable no-undef */
// 多物品支持版本
// 每个物品可以配置多个收集位置，和对应的商店位置

// 请输入以下指令，禁用破坏和防止穿过云杉栅栏门
// #blocksToAvoid spruce_fence_gate
// #allowBreak false

const Pos3D = Java.type('xyz.wagyourtail.jsmacros.client.api.classes.math.Pos3D');
const BaritoneAPI = Java.type('baritone.api.BaritoneAPI');
const GoalBlock = Java.type('baritone.api.pathing.goals.GoalBlock');

// ========== 配置区域 ==========
const CONFIG = {
  scriptName: 'Doki 卖物资 - 多物品版',
  distance: 4.0, // 搜索箱子的距离
  containers: [{ blockId: 'minecraft:chest', blockStates: ['type=left', 'type=single'] }], // 容器类型

  // 物品配置列表
  items: [
    {
      name: '仙人掌',
      itemId: 'minecraft:cactus',
      // 收集位置列表（按顺序访问）
      collectPositions: [new Pos3D(28976, 20, 14008), new Pos3D(28976, 20, 13992)],
      // 商店配置
      shop: {
        shopPos: new Pos3D(641, 10, -967), // 商店寻路目标位置
        signPos: new Pos3D(641, 11, -967), // 告示牌位置
        sellSlot: 31, // 出售界面中要点击的槽位
      },
      enabled: true, // 是否启用此物品
    },
    {
      name: '甘蔗',
      itemId: 'minecraft:sugar_cane',
      collectPositions: [
        new Pos3D(28975, 20, 14045),
        new Pos3D(28971, 20, 14045),
        new Pos3D(28967, 20, 14045),
      ],
      shop: {
        shopPos: new Pos3D(635, 10, -967), // 商店寻路目标位置
        signPos: new Pos3D(635, 11, -967), // 告示牌位置
        sellSlot: 33, // 出售界面中要点击的槽位
      },
      enabled: true,
    },
  ],
};
// ========== 配置区域结束 ==========

const scriptName = CONFIG.scriptName;
const enabled = GlobalVars.toggleBoolean(scriptName);

// 全局状态
let currentCollectedItems = new Map(); // 记录当前收集到的物品
let openedChestsCache = new Set(); // 记录已打开过的箱子（每轮清空）

/**
 * 将位置转换为字符串键
 */
function posToKey(pos) {
  return `${pos.getX()},${pos.getY()},${pos.getZ()}`;
}

function logColored(text, color) {
  Chat.log(
    Chat.createTextBuilder()
      .append('[')
      .withColor(0x7)
      .append(scriptName)
      .withColor(0x9)
      .append(']')
      .withColor(0x7)
      .append(` ${text}`)
      .withColor(color)
      .build()
  );
}

function isEnabled() {
  return GlobalVars.getBoolean(scriptName);
}

function waitScreen(name, timeout = 5000) {
  const startTime = Date.now();
  const names = Array.isArray(name) ? name : [name];

  while (isEnabled() && Date.now() - startTime < timeout) {
    const title = Player.openInventory().getContainerTitle();
    if (names.some((n) => title.includes(n))) return true;
    Time.sleep(50);
  }

  Chat.log(`等待界面超时: ${name}`);
  return false;
}

function interactBlock(pos) {
  const im = Player.getInteractionManager();
  const dir = Player.getPlayer().getFacingDirection().getOpposite().getName();
  im.interactBlock(pos.getX(), pos.getY(), pos.getZ(), dir, false);
}

function findBlock(block, distance) {
  const scanner = World.getWorldScanner();
  if (block.blockId) scanner.withStringBlockFilter().contains(block.blockId);
  if (block.blockStates) scanner.withStringStateFilter().contains(...block.blockStates);
  const playerPos = Player.getPlayer().getPos();
  return Java.from(
    scanner.build().scanSphereArea(playerPos.getX(), playerPos.getY(), playerPos.getZ(), distance)
  );
}

/**
 * 从附近箱子收集指定物品
 * @param {Array<string>} itemIds - 要收集的物品ID列表
 * @returns {boolean} 是否背包已满
 */
function takeItemsFromNearbyChest(itemIds) {
  const posList = CONFIG.containers.flatMap((c) => findBlock(c, CONFIG.distance));

  for (const pos of posList) {
    if (!isEnabled()) break;

    const posKey = posToKey(pos);

    // 跳过已打开过的箱子
    if (openedChestsCache.has(posKey)) {
      continue;
    }

    Client.waitTick(1);
    interactBlock(pos);
    waitScreen('箱子');
    Client.waitTick(2);

    const inv = Player.openInventory();
    let hasTargetItem = false; // 记录是否有目标物品

    for (let i = 0; i <= 53; i++) {
      if (inv.findFreeInventorySlot() === -1) {
        inv.close();
        return true; // 背包已满
      }

      const item = inv.getSlot(i);
      const itemId = item.getItemId();
      const count = item.getCount();
      if (itemIds.includes(itemId)) {
        hasTargetItem = true;
        inv.quick(i);
        Time.sleep(25);
        currentCollectedItems.set(itemId, (currentCollectedItems.get(itemId) || 0) + count);
      }
    }

    inv.close();

    // 如果这个箱子没有目标物品，添加到缓存，下次不再打开
    if (!hasTargetItem) {
      openedChestsCache.add(posKey);
    }
  }

  return false; // 背包未满
}

function baritoneGoto(pos) {
  const baritone = BaritoneAPI.getProvider().getPrimaryBaritone();
  const goalProcess = baritone.getCustomGoalProcess();
  const goal = new GoalBlock(pos.x, pos.y, pos.z);
  goalProcess.setGoalAndPath(goal);
}

function waitForBaritone() {
  const maxWait = 60000; // 60秒
  const startTime = Date.now();
  while (isEnabled() && Date.now() - startTime < maxWait) {
    if (!BaritoneAPI.getProvider().getPrimaryBaritone().getCustomGoalProcess().isActive()) break;
    Time.sleep(50);
  }
}

/**
 * 前往商店并出售物品
 * @param {Object} shopConfig - 商店配置
 */
function gotoShopAndSell(shopConfig) {
  Chat.log('前往卖出物资');

  const im = Player.getInteractionManager();

  // 传送到商店
  Player.openInventory().setSelectedHotbarSlotIndex(8);
  Client.waitTick(5);
  im.interactItem(false);
  waitScreen('梦落岛');
  Client.waitTick(5);
  Player.openInventory().click(33);
  waitScreen('商店');
  Client.waitTick(20);
  Player.openInventory().click(10);

  while (World.getDimension() !== 'minecraft:spawn' && isEnabled()) Time.sleep(100);
  Client.waitTick(20);
  Player.openInventory().setSelectedHotbarSlotIndex(0);

  // 寻路到商店
  baritoneGoto(shopConfig.shopPos);
  waitForBaritone();

  // 攻击告示牌打开交易界面
  const dir = Player.getPlayer().getFacingDirection().getOpposite().getName();
  const { x, y, z } = shopConfig.signPos;
  im.attack(x, y, z, dir);
  Time.sleep(55);
  im.attack(x, y, z, dir);
  waitScreen(['出售', '购买类型']);
  Client.waitTick(5);

  // 出售物品
  Player.openInventory().quick(shopConfig.sellSlot);
  Time.sleep(1000);
}

/**
 * 返回岛屿
 */
function returnToIsland() {
  Chat.say('/is');
  while (World.getDimension() !== 'minecraft:askyblock' && isEnabled()) {
    Time.sleep(100);
  }
  Time.sleep(1000);
}

/**
 * 收集并出售指定物品（循环直到清空所有收集点）
 */
function collectAndSellItem(itemConfig) {
  if (!itemConfig.enabled) return false;

  Chat.log(`========== 开始处理 ${itemConfig.name} ==========`);
  let totalCollected = 0;
  let roundCount = 0;
  openedChestsCache.clear(); // 每轮开始时清空缓存

  while (isEnabled()) {
    roundCount++;
    Chat.log(`[${itemConfig.name}] 第 ${roundCount} 轮`);
    currentCollectedItems.clear();

    let inventoryFull = false;

    // 遍历所有收集位置
    for (const pos of itemConfig.collectPositions) {
      if (!isEnabled()) break;

      baritoneGoto(pos);
      waitForBaritone();

      inventoryFull = takeItemsFromNearbyChest([itemConfig.itemId]);
      Player.openInventory().close();

      // 背包满了就停止遍历，去出售
      if (inventoryFull) break;
    }

    // 统计本轮收集数量
    const roundCollected = currentCollectedItems.get(itemConfig.itemId) || 0;
    if (roundCollected > 0) {
      Chat.log(`  本轮收集: ${roundCollected}`);
      totalCollected += roundCollected;
    }

    // 如果遍历完所有收集点后背包还没满，说明所有箱子都已清空
    const allChestsEmpty = !inventoryFull;

    // 如果收集到物品，前往出售
    if (roundCollected > 0) {
      Time.sleep(1000);
      gotoShopAndSell(itemConfig.shop);
      returnToIsland();
    }

    // 所有箱子都空了，退出循环
    if (allChestsEmpty) {
      Chat.log(`[${itemConfig.name}] 收集点已清空`);
      break;
    }
  }

  if (totalCollected > 0) {
    Chat.log(`========== ${itemConfig.name} 完成，共收集 ${totalCollected} 个 ==========`);
  }
  return totalCollected > 0;
}

function onStop(message = '', exitBaritone = false) {
  GlobalVars.putBoolean(scriptName, false);
  logColored(`Disabled: ${message}`, 0x4);
  if (exitBaritone) {
    Chat.say('#c');
  }
  JsMacros.disableScriptListeners();
}

function main() {
  if (!enabled) return onStop('', true);

  logColored('Enabled', 0x2);
  if (World.getDimension() !== 'minecraft:askyblock') {
    return onStop('请在岛上启用本脚本！');
  }
  if (!Player.openInventory().getSlot(44).getName().getString().includes('主菜单')) {
    return onStop('未发现主菜单，请把主菜单放到9号快捷栏');
  }
  Player.openInventory().setSelectedHotbarSlotIndex(0);

  // 主循环
  while (isEnabled()) {
    for (const itemConfig of CONFIG.items) {
      if (!isEnabled()) break;
      collectAndSellItem(itemConfig);
    }

    if (isEnabled()) {
      Chat.log('本轮完成，等待10秒...');
      // 分段等待，快速响应停止
      for (let i = 0; i < 100 && isEnabled(); i++) {
        Time.sleep(100);
      }
    }
  }
}

module.exports = main();
