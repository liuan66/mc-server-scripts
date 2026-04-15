const Baritone = require('baritone.js')
const { isInventoryFull, getNearestEntity } = require('utils.js')
// 单例模式
class AutoTracer {
    constructor(mobType, dropList = ['*'], mode = 'Both', attackDistance = 4, debug = false) {
        this.debug = debug
        this.mobType = mobType
        this.mode = mode
        this.dropList = new Set(dropList)
        this.attackDistance = attackDistance
        this.blackDrop = new Set([])
        this.scanAroundRadius = this.attackDistance + 5
        this.pauseFlag = false
    }

    // 扫描并拾取掉落物
    scanDrop() {
        if (isInventoryFull()) {
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
                if (this.dropList.has('*')) {
                    return true
                }
                return (
                    this.dropList.has(itemStack.getItemId().toString()) ||
                    this.dropList.has(itemStack.getName().toString())
                )
            }
        })

        if (filteredDrops.length === 0) return

        // 按距离最近排序
        const itemEntity = getNearestEntity(filteredDrops)
        const result = this.checkCanPickUp(itemEntity)
        if (result) {
            this.pickUpDrop(itemEntity)
        }
        this.followEntity()
    }
    scanExp() {
        const expOrbs = World.getEntities(this.scanAroundRadius, 'experience_orb')
        if (expOrbs.length === 0) return
        const nearestExpOrb = getNearestEntity(expOrbs)
        const result = this.checkCanPickUp(nearestExpOrb)
        if (result) {
            this.pickUpDrop(nearestExpOrb)
        }
        this.followEntity()
    }
    checkCanPickUp(entity) {
        Baritone.cancel()
        this.debugLog(`§a等待落地! ${entity.getX()}, ${entity.getY()}, ${entity.getZ()}`)
        while (true) {
            if (!entity.isAlive()) {
                this.debugLog('§c掉落物已消失或者拾取, 放弃拾取!')
                return false
            }
            if (entity.getRaw().method_5869()) {
                this.debugLog('§c掉落物在水里, 放弃拾取!')
                this.blackDrop.add(entity.getUUID())
                return false
            }
            const box = entity.getRaw().method_5829()
            for (let x = Math.floor(box.field_1323); x <= Math.floor(box.field_1320); x++) {
                for (let y = Math.floor(box.field_1322); y <= Math.floor(box.field_1325); y++) {
                    for (let z = Math.floor(box.field_1321); z <= Math.floor(box.field_1324); z++) {
                        if (World.getBlock(x, y, z)?.getId() === 'minecraft:cobweb') {
                            this.debugLog('§c掉落物在网上, 放弃拾取!')
                            this.blackDrop.add(entity.getUUID())
                            return false
                        }
                    }
                }
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
            Chat.log(`§7[${new Date().toLocaleString()}] ${message}`)
        }
    }
    // 执行物品拾取
    pickUpDrop(entity) {
        let targetX = Math.floor(entity.getX())
        let targetY = Math.floor(entity.getY())
        let targetZ = Math.floor(entity.getZ())
        this.debugLog('§a开始计算高度!')
        const blockId = World.getBlock(targetX, targetY, targetZ)?.getId()
        const raiseBlocks = ['stairs', 'slab', 'trapdoor', 'dirt_path']
        if (!blockId) {
            this.debugLog('§c无法获取方块信息, 放弃拾取!')
            return
        }
        if (raiseBlocks.some((keyword) => blockId.includes(keyword))) {
            this.debugLog(
                '§a检测到需抬高的方块: ' +
                    World.getBlock(targetX, targetY, targetZ).getName().getString()
            )
            targetY += 1
        } else {
            if (World.getBlock(targetX, targetY - 1, targetZ)?.getId() === 'minecraft:air') {
                this.debugLog('§a检测到需要计算碰撞箱')
                const box = entity.getRaw().method_5829()
                for (let x = Math.floor(box.field_1323); x <= Math.floor(box.field_1320); x++) {
                    for (let y = Math.floor(box.field_1322); y <= Math.floor(box.field_1325); y++) {
                        for (
                            let z = Math.floor(box.field_1321);
                            z <= Math.floor(box.field_1324);
                            z++
                        ) {
                            if (World.getBlock(x, y - 1, z)?.getId() !== 'minecraft:air') {
                                targetX = x
                                targetY = y
                                targetZ = z
                                this.debugLog(`§a计算成功`)
                                break
                            }
                        }
                    }
                }
            }
        }

        this.debugLog(`§a计算坐标成功! ${targetX} ${targetY} ${targetZ}`)
        const itemName = entity.getName().getString()
        // 已经拾取了
        if (itemName === '空气') {
            return
        }
        Chat.log('§a拾取物品: ' + itemName)
        Baritone.goto(targetX, targetY, targetZ)
        const start = new Date().getTime()
        Chat.log(`§a正在前往目标点 ${targetX} ${targetY} ${targetZ}!`)
        while (entity.isAlive()) {
            // 暂停退出
            if (new Date().getTime() - start > 5000) {
                Chat.log(`§c拾取超时, 放弃并且拉黑掉落物!`)
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
        const entities = World.getEntities(this.attackDistance, this.mobType).filter(
            (e) =>
                e.isAlive() && e.getName().getString() !== Player.getPlayer().getName().getString()
        )
        if (entities && entities.length > 0) {
            const nearestEntity = getNearestEntity(entities)
            const eyePos = nearestEntity.getEyePos()
            player.lookAt(eyePos.x, eyePos.y, eyePos.z)
            player.attack(nearestEntity)
        }
    }
    followEntity() {
        if (this.pauseFlag) {
            return
        }
        this.debugLog('§a开始跟踪怪物!')
        Baritone.follow(this.mobType)
    }
    // 主循环
    run() {
        this.followEntity()
        JavaWrapper.methodToJavaAsync(() => {
            while (true) {
                Time.sleep(200)
                if (this.pauseFlag) {
                    continue
                }
                this.attackMob()
                if (this.mode === 'Both' || this.mode === 'Item') {
                    this.scanDrop()
                }
                if (this.mode === 'Both' || this.mode === 'Exp') {
                    this.scanExp()
                }
            }
        }).run()
        this.run = this.resume
    }
    resume() {
        this.pauseFlag = false
        this.followEntity()
    }
    pause() {
        this.pauseFlag = true
        Baritone.cancel()
    }
    stop() {
        Baritone.cancel()
        JavaWrapper.stop()
    }
}
module.exports = AutoTracer
