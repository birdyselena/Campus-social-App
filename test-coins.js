// 临时测试文件来检查积分系统
import { userStorage, coinsService } from "./src/services/localStorage.js";

async function testCoinsSystem() {
  console.log("开始测试积分系统...");

  // 创建测试用户
  const testUser = {
    id: "test_user_123",
    full_name: "Test User",
    email: "test@example.com",
    university: "Test University",
    coins_balance: 50,
  };

  try {
    // 测试获取积分余额
    console.log("测试获取积分余额...");
    const balance = await coinsService.getUserCoinsBalance(testUser.id);
    console.log("当前积分余额:", balance);

    // 测试每日登录奖励
    console.log("测试每日登录奖励...");
    const loginReward = await coinsService.rewardDailyLogin(testUser.id);
    console.log("每日登录奖励:", loginReward);

    // 测试更新后的余额
    const newBalance = await coinsService.getUserCoinsBalance(testUser.id);
    console.log("更新后的积分余额:", newBalance);

    console.log("积分系统测试完成！");
  } catch (error) {
    console.error("测试失败:", error.message);
  }
}

// 运行测试
testCoinsSystem();
