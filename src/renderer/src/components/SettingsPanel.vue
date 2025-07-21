<template>
  <div class="settings-panel">
    <n-form label-width="80" size="small">
      <n-grid :cols="4" :x-gap="24">
        <n-gi>
          <n-form-item label="Token">
            <n-input v-model:value="form.token" placeholder="请输入Token" size="small" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="Git用户名">
            <n-input v-model:value="form.gitUser" placeholder="请输入Git用户名" size="small" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="OA账号">
            <n-input v-model:value="form.oaAccount" placeholder="请输入OA账号" size="small" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="OA密码">
            <n-input v-model:value="form.oaPassword" placeholder="请输入OA密码" size="small" />
          </n-form-item>
        </n-gi>
      </n-grid>
      <n-form-item label="日报模板">
        <n-input
          v-model:value="form.dailyTemplate"
          type="textarea"
          placeholder="请输入日报模板"
          size="small"
          :autosize="{ minRows: 6, maxRows: 6 }"
          class="template-input"
        />
      </n-form-item>
      <n-form-item label="周报模板">
        <n-input
          v-model:value="form.weeklyTemplate"
          type="textarea"
          placeholder="请输入周报模板"
          size="small"
          :autosize="{ minRows: 6, maxRows: 6 }"
          class="template-input"
        />
      </n-form-item>
    </n-form>
    <div class="actions">
      <n-space justify="end" gap="12px">
        <n-button type="primary" size="small" @click="saveSettings">保存</n-button>
        <n-button size="small" @click="restoreDefault">恢复默认</n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  useMessage,
  NSpace,
  NGrid,
  NGi
} from 'naive-ui'

const DEFAULT_DAILY = `你是一位专业的团队领导，你的任务是分析 Git commit 日志并生成一份清晰的工作总结。
请遵循以下规则:
1. 仔细阅读下面提供的 Commit 日志。
2. 根据日志内容，将工作内容按功能模块进行归类。
3. 以数字列表的形式输出总结，每个列表项代表一个模块的工作。
4. 每个列表项的格式必须为：“[序号]、[模块名]：[具体的修改内容]”。例如：“1、用户管理模块：修复了无法删除用户的bug。”
5. 列表项之间不要有任何空行，但是每个列表项必须单独占一行。
6. 总结内容必须简洁、清晰，直接描述完成的工作，限制100字以内。
7. 绝对不要在你的回复中使用任何 Markdown 格式（例如 ###、** 或 *）。

Commit 日志:
{commit_logs}

请开始生成工作总结:`

const DEFAULT_WEEKLY = `你是一个顶级的项目经理和技术领导。请根据下面按天和项目分组的 Git 提交记录，生成一份高度概括、重点突出、语言流畅的中文周报。

你的任务是：
1.  仔细分析每一天的 commit 记录。
2.  将零散的 commit 信息提炼成对当天工作核心内容的总结，而不是简单罗列。
3.  如果某天没有提交记录，请明确指出“暂无提交记录”。
4.  最终的输出必须严格遵循下面的格式，以星期为单位进行组织。
5.  每个项目的工作总结必须以项目名开头，以冒号分隔，每天的完成工作不可换行和换列，也不可用-号开头。
6.  总结内容必须简洁、清晰，直接描述完成的工作，字数不要超过200字。
7.  绝对不要在你的回复中使用任何 Markdown 格式（例如 ###、** 或 *）。

[高质量输出范例]
星期一：暂无提交记录
星期二：[项目名]：大量功能优化包括首页分类导航、订单管理、搜索功能、店铺详情等多个模块的完善和bug修复
星期三：[项目名]：主要进行订单物流显示、搜索结果页面、购物车样式、收藏功能等的优化和新增推荐商品页面
星期四：[项目名]：重点开发积分系统功能、批量订单处理、商品详情页轮播图优化、评价系统改进等大量功能更新
星期五：[项目名]：主要更新接口地址配置、VIP页面会员功能和积分订单流程优化
星期六：[项目名]：修复米林APPbug

[待总结的 Commit 记录]
{commit_logs}`

const LOCAL_KEY = 'githelper-settings'
const defaultForm = {
  token: '',
  gitUser: '',
  dailyTemplate: DEFAULT_DAILY,
  weeklyTemplate: DEFAULT_WEEKLY,
  oaAccount: '',
  oaPassword: ''
}
const form = ref({ ...defaultForm })
const message = useMessage()
const emit = defineEmits(['save'])
const loadSettings = () => {
  const raw = localStorage.getItem(LOCAL_KEY)
  if (raw) {
    try {
      Object.assign(form.value, JSON.parse(raw))
    } catch {}
  }
}
const saveSettings = () => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(form.value))
  emit('save')
  message.success('保存成功')
}
const restoreDefault = () => {
  form.value.dailyTemplate = DEFAULT_DAILY
  form.value.weeklyTemplate = DEFAULT_WEEKLY
  saveSettings()
  message.success('已恢复默认模板')
}

loadSettings()
</script>

<style scoped lang="scss">
.settings-panel {
  width: 100%;
  min-width: 400px;
  max-width: 900px;
  margin: 0 auto;

  ::v-deep(.n-form-item .n-form-item-feedback-wrapper) {
    min-height: 18px;
  }
}

.template-input {
  width: 100%;
  min-width: 300px;
  max-width: 100%;
}
</style>
