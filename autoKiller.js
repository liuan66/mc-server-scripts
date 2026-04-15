const BaritoneAPI = Java.type('baritone.api.BaritoneAPI')
const GoalBlock = Java.type('baritone.api.pathing.goals.GoalBlock')
const SettingsUtil = Java.type('baritone.api.utils.SettingsUtil')
const Registries = Java.type('net.minecraft.class_7923')
const Thread = Java.type('java.lang.Thread')
const Identifier = Java.type('net.minecraft.class_2960')

// 单例模式
class Baritone {
    constructor() {
        this.baritone = BaritoneAPI.getProvider().getPrimaryBaritone()
    }
    baritoneCancel() {
        this.baritone.getPathingBehavior().cancelEverything()
    }
    baritoneGoto(x, y, z) {
        this.baritone.getCustomGoalProcess().setGoalAndPath(new GoalBlock(x, y, z))
    }
    baritoneFollow(mobType) {
        // const classes = new Set()
        // const EntityType = Registries.field_41177
        // for (const idStr of mobType) {
        //     const identifier = Identifier.method_60654(idStr)
        //     const entityType = EntityType.method_63535(identifier)
        //     classes.add(entityType)
        // }
        // // 优先级执行最低 不要阻塞渲染进程
        // this.filter = JavaWrapper.methodToJavaAsync((entity) => {
        //     const type = entity.method_5864()
        //     return classes.has(type)
        // })
        // this.baritone.getFollowProcess().follow(this.filter)
        Chat.say('#follow entity ' + mobType.join(' '), true)
    }
    baritoneParseAndApply(settingName, settingsValue) {
        const settings = BaritoneAPI.getSettings()
        SettingsUtil.parseAndApply(settings, settingName, settingsValue)
    }
}

// 单例模式
class AutoKiller {
    constructor(debug = false) {
        // 暂停标志位
        this.paused = false
        this.debug = debug
        this.autoKiller = false
        this.whitePlayer = new Set([
            'Player1',
            'Player2',
            'Player3',
        ])

        this.mobType = ['minecraft:zombie', 'minecraft:skeleton']
        this.blackDrop = new Set([])
        this.dropList = new Set(['minecraft:iron_bars', 'minecraft:bone_meal', 'minecraft:rotten_flesh'])
        this.followRadius = Math.floor(Player.getReach())
        this.attackDistance = Player.getReach()
        this.scanAroundRadius = Player.getReach() + 5
        this.checkDistance = 200
        this.baritone = new Baritone()
    }

    getDistanceToEntity(entity) {
        const player = Player.getPlayer()
        return player.distanceTo(entity)
    }

    // 检查附近的玩家
    checkAround() {
        // const entityNames = World.getEntities(this.checkDistance, 'player')
        const entityNames = World.getEntities('player')
            .filter((e) => !this.whitePlayer.has(e.getName().getString()))
            .map((e) => e.getName().getString())
        if (entityNames.length > 0 && !this.paused) {
            Chat.log('§c发现' + entityNames.join(' ') + ',脚本暂停!')
            FS.open('player.txt').append(
                `[${new Date().toLocaleString()}] 发现玩家: ${entityNames.join(' ')}\n`
            )
            this.paused = true
            this.baritone.baritoneCancel()
        } else if (entityNames.length === 0 && this.paused) {
            this.paused = false
            Chat.log('§a脚本恢复!')
            FS.open('player.txt').append(`[${new Date().toLocaleString()}] 脚本恢复正常\n`)
            this.followEntity()
        }
    }
    invIsFull() {
        const inv = Player.openInventory()
        return inv.findFreeInventorySlot() === -1
    }
    // 扫描并拾取掉落物
    scanDrop() {
        if (this.invIsFull()) {
            Chat.actionbar('§c背包已满, 放弃拾取!')
            return
        }
        const drops = World.getEntities(this.scanAroundRadius, 'item')
        const filteredDrops = drops.filter((entity) => {
            const type = entity.getType()
            if (type === 'minecraft:item') {
                const itemStack = entity.getContainedItemStack()
                if (this.blackDrop.has(entity.getUUID())) {
                    return false
                }
                return this.dropList.has(itemStack.getItemId().toString())
            }
        })

        if (filteredDrops.length === 0) return

        // 按距离最近排序
        const itemEntity = this.getNearestEntity(filteredDrops)
        const result = this.checkCanPickUp(itemEntity)
        if (result) {
            this.pickUpDrop(itemEntity)
        }
        this.followEntity()
    }
    scanExp() {
        const expOrbs = World.getEntities(this.scanAroundRadius, 'experience_orb')
        if (expOrbs.length === 0) return
        const nearestExpOrb = this.getNearestEntity(expOrbs)
        const result = this.checkCanPickUp(nearestExpOrb)
        if (result) {
            this.pickUpDrop(nearestExpOrb)
        }
        this.followEntity()
    }
    checkCanPickUp(entity) {
        this.baritone.baritoneCancel()
        this.debugLog(`§a等待落地! ${entity.getX()}, ${entity.getY()}, ${entity.getZ()}`)
        while (true) {
            if (!entity.isAlive()) {
                this.debugLog('§c掉落物已消失或者拾取, 放弃拾取!')
                return false
            }
            if (entity.getRaw().method_5799()) {
                this.debugLog('§c掉落物在水里, 放弃拾取!')
                this.blackDrop.add(entity.getUUID())
                return false
            }
            if (entity.getRaw().method_24828()) {
                this.debugLog(`§a落地成功! ${entity.getX()}, ${entity.getY()}, ${entity.getZ()}`)
                return true
            }
            Time.sleep(100)
        }
    }
    debugLog(message) {
        if (this.debug) {
            Chat.log(`§a${message}`)
        }
    }
    // 执行物品拾取
    pickUpDrop(entity) {
        const x = Math.floor(entity.getX())
        let y = Math.floor(entity.getY())
        const z = Math.floor(entity.getZ())
        this.debugLog('§a开始计算高度!')
        while (World.getBlock(x, y - 1, z).getId() === 'minecraft:air') {
            y--
            Time.sleep(100)
        }
        const blockId = World.getBlock(x, y, z).getId()
        const raiseBlocks = ['stairs', 'slab', 'trapdoor', 'dirt_path']

        if (raiseBlocks.some((keyword) => blockId.includes(keyword))) {
            this.debugLog('§a检测到需抬高的方块: ' + World.getBlock(x, y, z).getName().getString())
            y += 1
        }

        this.debugLog('§a计算高度成功! y=' + y)
        const itemName = entity.getName().getString()
        // 已经拾取了
        if (itemName === '空气') {
            return
        }
        Chat.log('§a拾取物品: ' + itemName)
        this.baritone.baritoneGoto(x, y, z)
        const start = new Date().getTime()
        Chat.log(`§a正在前往目标点 (${x}, ${y}, ${z})!`)
        while (entity.isAlive() && this.autoKiller) {
            // 暂停退出
            if (this.paused) return
            // 超时退出
            if (new Date().getTime() - start > 10000) {
                Chat.log(`§c拾取超时, 放弃并且拉黑掉落物! 在方块${blockId}上`)
                this.blackDrop.add(entity.getUUID())
                return
            }
            Time.sleep(1000)
        }
        Chat.log('§a拾取成功!' + itemName)
    }
    // 攻击怪物
    attackMob() {
        const player = Player.getPlayer()
        const entities = World.getEntities(this.attackDistance, this.mobType)
        if (entities && entities.length > 0) {
            const process = player.getAttackCooldownProgress()
            if (process === 1) {
                const nearestEntity = this.getNearestEntity(entities)
                player.attack(nearestEntity)
                // const offsetY = nearestEntity.getRaw().method_17682() / 2
                // const pos = nearestEntity.getPos()
                // player.lookAt(pos.getX(), pos.getY() + offsetY, pos.getZ())
                // try {
                //     if (
                //         Player.rayTraceEntity(this.attackDistance)?.getRaw() ===
                //         nearestEntity.getRaw()
                //     ) {
                //         player.attack()
                //     }
                // } catch (e) {
                //     Chat.log('§c射线检测失败!')
                // }
            }
        }
    }
    followEntity() {
        if (this.paused || !this.autoKiller) {
            return
        }
        this.debugLog('§a开始跟踪怪物!')
        this.baritone.baritoneFollow(this.mobType)
    }
    getNearestEntity(array) {
        return array.reduce((prev, curr) => {
            return this.getDistanceToEntity(curr.getPos()) < this.getDistanceToEntity(prev.getPos())
                ? curr
                : prev
        })
    }
    // 初始化功能
    init() {
        // 注册事件
        const AutoKillerEvent = JsMacros.createCustomEvent('AutoKillerEvent')
        AutoKillerEvent.registerEvent()
        const profile = JsMacros.getProfile()
        const listeners = profile.getRegistry().getListeners('AutoKillerEvent')
        if (listeners.size() > 0) {
            AutoKillerEvent.trigger()
            this.autoKiller = false
            Chat.actionbar('§c自动点击已关闭')
            this.baritone.baritoneCancel()
        } else {
            JsMacros.once(
                'AutoKillerEvent',
                JavaWrapper.methodToJava((e) => {
                    this.autoKiller = false
                })
            )
            this.autoKiller = true
            Chat.actionbar('§a自动点击已开启')
            this.baritone.baritoneParseAndApply('followradius', this.followRadius.toString())
            this.followEntity()
        }
        JavaWrapper.methodToJavaAsync(() => {
            while (this.autoKiller) {
                this.checkAround()
                Time.sleep(200)
            }
        }).run()
    }

    // 主循环
    run() {
        this.init()

        while (this.autoKiller) {
            if (this.paused) {
                Time.sleep(1000)
                continue
            }
            this.attackMob()
            this.scanDrop()
            this.scanExp()
            Time.sleep(200)
        }
    }
}

const autoKiller = new AutoKiller(true)
autoKiller.run()
