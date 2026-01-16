# Step 4: 实现

## 4.1 根据Spec实现

按照 step2 的设计和 step3 的audit计划逐步实现。

## 4.2 依赖处理

遇到新依赖时：
1. 直接安装: `pip install xxx -i https://pypi.mirrors.ustc.edu.cn/simple/`
2. 记录到 progress.json 的 `new_dependencies` 数组

## 4.3 异常处理

**超时/卡住时**:
1. 告知用户当前状态
2. 彻底暂停
3. 与用户一起彻查原因
4. 查不出原因 -> 回滚到branch创建点

## 4.4 记录

将实现细节写入 `step4-impl-spec.md`

**完成后更新 progress.json: step 4 = completed, step 5 = in_progress**
