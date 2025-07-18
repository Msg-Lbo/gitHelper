const { execSync } = require('child_process');

const version = process.argv[2];
const step = process.argv[3];
if (!version) {
  console.error('错误：请提供需要回退的版本标签（例如：v1.2.3）');
  console.error('用法：node scripts/revert-release.js <版本号>');
  process.exit(1);
}

if (!step) {
  console.error('错误：请提供需要回退的步骤（1,2,3）');
  console.error('用法：node scripts/revert-release.js <版本号> <步骤>');
  process.exit(1);
}

console.log(`正在回退版本：${version}`);

try {
  console.log(`[1/3] 删除本地标签：${version}...`);
  execSync(`git tag -d ${version}`);
  console.log('本地标签删除成功。');

  console.log(`[2/3] 删除远程标签：${version}...`);
  execSync(`git push origin --delete ${version}`);
  console.log('远程标签删除成功。');

  console.log('[3/3] 回退发布提交...');
  execSync(`git reset HEAD~${step}`);
  console.log('提交回退成功。');

  execSync('git push -f');
  console.log('版本提交已回退。');

} catch (error) {
  console.error('\n回退过程中发生错误：');
  console.error(error.message);
  process.exit(1);
}
