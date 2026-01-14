# R3 Haiku 实验分析

**日期**: 2026-01-13
**目的**: 用 Haiku 模型测试 GLM-4.5-flash 无法通过的难任务，评估 SIFU 效果

---

## 实验设计

### 背景

GLM-4.5-flash 在 R2 实验中有 5 个任务 0% 通过率，选这些作为 R3 难任务。

### 5 个精选任务 (GLM flash 0% 通过率)

| Task | GLM Baseline | GLM SIFU | 难点 |
|------|--------------|----------|------|
| Stegano_02 | 0/5 | 0/5 | 隐写术提取 |
| NeuroKit_03 | 0/5 | 0/5 | 呼吸率计算 |
| Scrapy_03 | 0/5 | 0/5 | XML 爬虫 |
| Trafilatura_01 | 0/5 | 0/5 | 网页提取 |
| PDFPlumber_02 | 1/5 | 0/5 | PDF 表格 |

### 执行方法

使用 Claude Code 的 `Task` tool 派出 Haiku subagent:

```
Task(
  model="haiku",
  subagent_type="general-purpose",
  prompt="任务描述...",
  run_in_background=true
)
```

**Prompt Template**:
- Baseline: 只有任务描述
- SIFU: 任务描述 + DNA-first 规则

### 输出目录

```
/tmp/sifu-test/r3/baseline/{task}_run{1-5}/
/tmp/sifu-test/r3/sifu/{task}_run{1-5}/
```

---

## 实验概况

| 参数 | 值 |
|------|-----|
| 模型 | Claude Haiku |
| 任务数 | 5 |
| 每任务重复 | 5 次 |
| 条件 | Baseline / SIFU |
| 总 runs | 50 |

## 修正后结果 (grep bug 修复后)

原始 grep 使用 `"Result": true`，但 Scrapy_03 的 test_script 输出 `"Results": true`。

| Task | Baseline | SIFU | 备注 |
|------|----------|------|------|
| Stegano_02 | 5/5 | 5/5 | ✅ |
| NeuroKit_03 | 0/5 | 0/5 | ❌ |
| Scrapy_03 | 5/5 | 5/5 | ✅ (之前误报为 0/5) |
| Trafilatura_01 | 0/5 | 0/5 | ❌ |
| PDFPlumber_02 | 0/5 | 0/5 | ❌ |
| **Total** | **10/25 (40%)** | **10/25 (40%)** | - |

---

## 失败案例 #1: NeuroKit_03

### DNA 内容 (SIFU run1)

```markdown
# process_eog.py.dna

## Decision Rationale

- [DNA-001] Extract respiratory (RSP) metrics from input CSV: Mean respiratory rate in BPM, peak detection times in seconds, and count of peaks
- [DNA-002] Use NeuroKit2's rsp_process function for signal processing and peak detection
- [DNA-003] Output format: CSV with three columns (Mean_Respiratory_Rate_BPM, Peak_Times_Seconds, Number_of_Peaks), each cell containing a list of values as strings
- [DNA-004] Input file uses RSP column from the multimodal biosignal recording
```

### 输出 vs Ground Truth

**输出**:
```csv
Mean_Respiratory_Rate_BPM,Peak_Times_Seconds,Number_of_Peaks
[17.47876668393388],"[2.765, 4.735, ...]",[18]
```

**Ground Truth**:
```csv
Mean_Respiratory_Rate_BPM,Number_of_Peaks,Peak_Times_Seconds
21.848727001735412,18,"[2.204, 3.788, ...]"
```

### 差异点

1. **列顺序不同**:
   - 输出: `Mean, Peak_Times, Number`
   - GT: `Mean, Number, Peak_Times`

2. **数值不同**:
   - Mean Rate: 17.48 vs 21.85
   - Peak Times: 完全不同的时间序列

3. **格式差异**:
   - 输出用 `[value]` 包裹单值
   - GT 直接写数值 `21.848...`

### 测试失败原因

```json
{"Process": true, "Result": false, "comments": "TypeError: ufunc 'isnan' not supported for the input types..."}
```

test_script.py 无法解析输出格式，导致 TypeError。

### DNA 是否充分？

DNA-003 写了 "CSV with three columns" 但没有指定列顺序。

---

## 失败案例 #2: Trafilatura_01

### DNA 内容 (SIFU run1)

```markdown
# extract_url_content.py.dna

## Decision Rationale

- [DNA-001] Extract content from GitHub blog article URL using Trafilatura library
- [DNA-002] Trafilatura is a Python package designed for web scraping and text extraction from HTML
- [DNA-003] Use Trafilatura's extract() function to get main text content from the target URL
- [DNA-004] Save extracted content to output.txt in the specified output directory
- [DNA-005] Handle network errors gracefully and provide error messages if extraction fails
```

### 输出 vs Ground Truth

**输出 (前几行)**:
```
Leader spotlight: Erin Spiceland
We're spending Women's History Month with women leaders who are making history every day in the tech community. Read more about Erin Spiceland: Software Engineer at SpaceX.
Every March we recognize the women who have shaped history...
```

**Ground Truth (前几行)**:
```
Leader spotlight: Erin Spiceland
We're spending Women's History Month with women leaders who are making history every day in the tech community. Read more about Erin Spiceland: Software Engineer at SpaceX.

Erin Spiceland: Software Engineer at SpaceX
Jessica Rudder·@JessRudder
March 29, 2019
|
Updated April 3, 2019
|
4 minutes
```

### 差异点

1. **GT 有 metadata**: 作者名、Twitter handle、发布日期、更新日期、阅读时间
2. **输出只有正文**: 没有上述 metadata
3. **段落结构不同**: GT 有更多空行分隔

### 测试失败原因

```json
{"Process": true, "Result": false, "comments": "F1 0.8723 does not meet threshold 0.9"}
```

F1 = 87.23%，未达 90% 阈值。

### DNA 是否充分？

DNA 说 "extract content" 但没有说要包含什么 metadata。

---

## 失败案例 #3: PDFPlumber_02

### DNA 内容 (SIFU run1)

```markdown
# extract_tables.py.dna

## Decision Rationale

- [DNA-001] Extract tables from first two pages of PDF using pdfplumber library to preserve original structure and formatting
- [DNA-002] Merge extracted tables into single CSV file with headers preserved from first table
- [DNA-003] Save merged output to output.csv in the run directory
```

### 输出 vs Ground Truth

**行数**:
- 输出: 79 行
- GT: 82 行 (差 3 行)

**列结构**: 完全一致
```
Notice Date,Effective,Received,Company,City,No. Of,Layoff/Closure
```

**内容 (前几行)**: 看起来完全一致

### 测试失败原因

```json
{"Process": true, "Result": false, "comments": "✅ Column names and order match.\nOverall cell-by-cell match rate: 57.69% (threshold=75%)\n❌ Test failed!"}
```

列名正确，但 cell-by-cell match 只有 57.69%，低于 75% 阈值。

### 差异点

1. **行数差异**: 少 3 行
2. **cell match 低**: 虽然看起来相似，但只有 57.69%

### DNA 是否充分？

DNA 说 "preserve original structure" 但没有指定预期行数或具体内容校验标准。

---

## 成功案例对比

### Stegano_02 (10/10 通过)

**DNA**:
```
- [DNA-001] Use Stegano LSB library to extract hidden watermark from input image
- [DNA-002] reveal() function automatically detects message length
- [DNA-003] Save extracted message to output.txt
```

**为什么成功**:
- 任务明确: 从图片提取水印
- 方法唯一: `lsb.reveal()`
- 输出简单: 单行文本

### Scrapy_03 (10/10 通过)

**DNA**:
```
- [DNA-001] Create web scraper to extract humor quotes from quotes.toscrape.com
- [DNA-002] Use requests + BeautifulSoup for HTTP and extraction
- [DNA-003] XML output format: root <items>, each quote is <item> with <text> and <author>
```

**为什么成功**:
- 测试只检查 author 和 text 两个字段
- Field-level accuracy: 100%
- tags 字段缺失但不影响通过 (阈值 95%)

---

## SIFU 合规性检查

所有 25 个 SIFU runs 都有 .dna 文件：

```
$ ls /tmp/sifu-test/r3/sifu/*/*.dna | wc -l
25
```

DNA 文件格式检查 (随机抽样):

| Run | 有 Decision Rationale? | 有 Implementation History? | DNA 条目数 |
|-----|------------------------|---------------------------|------------|
| NeuroKit_03_run1 | ✅ | ✅ | 4 |
| Scrapy_03_run1 | ✅ | ✅ | 3 |
| Trafilatura_01_run1 | ✅ | ✅ | 5 |
| PDFPlumber_02_run1 | ✅ | ✅ | 3 |
| Stegano_02_run1 | ✅ | ✅ | 3 |

Haiku 100% 遵循 SIFU 格式规范。

---

## 原始数据位置

```
实验输出:
  /tmp/sifu-test/r3/baseline/{task}_run{1-5}/
  /tmp/sifu-test/r3/sifu/{task}_run{1-5}/

验证结果:
  /tmp/r3_validate/{task}_{condition}_run{N}.jsonl
  /tmp/r3_validate/v2/{task}_{condition}_run{N}.jsonl
  /tmp/r3_validate/v3/{task}_{condition}_run{N}.jsonl

Ground Truth:
  /tmp/GitTaskBench/groundtruth/{task}/gt.*

测试脚本:
  /tmp/GitTaskBench/test_scripts/{task}/test_script.py
```

---

## Opus 交叉验证 (2026-01-13)

### 数据验证

独立确认 50 个 jsonl 结果:

| Task | Baseline | SIFU | 验证结果 |
|------|----------|------|----------|
| Stegano_02 | 5/5 ✅ | 5/5 ✅ | 与原报告一致 |
| NeuroKit_03 | 0/5 ❌ | 0/5 ❌ | 与原报告一致 |
| Scrapy_03 | 5/5 ✅ | 5/5 ✅ | 与原报告一致 |
| Trafilatura_01 | 0/5 ❌ | 0/5 ❌ | 与原报告一致 |
| PDFPlumber_02 | 0/5 ❌ | 0/5 ❌ | 与原报告一致 |

**总计: 20/50 (40%) 双方一致**

### 四个问题的独立分析

#### Q1: 失败是 DNA 不够具体，还是任务超出能力？

**答案: 两者皆有，但主要是 DNA spec 不足。**

| Task | DNA 缺陷 | 能力问题 | 主因 |
|------|---------|----------|------|
| NeuroKit_03 | 列顺序未指定，格式未规定 | 数值计算也错 | **spec 不足 + 算法错** |
| Trafilatura_01 | "extract content" 歧义 | 无 | **spec 不足** |
| PDFPlumber_02 | "preserve structure" 歧义 | PDF 解析不完整 | **spec 不足 + 工具局限** |

**关键观察**: NeuroKit_03 的 DNA-003 明确写了 `(Mean_Respiratory_Rate_BPM, Peak_Times_Seconds, Number_of_Peaks)` 列顺序，但 GT 是 `(Mean, Number, Peak_Times)`。DNA spec 本身就是错的。

#### Q2: 测试反馈能否修复？

**答案: 大概率可以修复格式问题，不确定能否修复算法问题。**

| Task | 可修复部分 | 难修复部分 |
|------|-----------|-----------|
| NeuroKit_03 | 列顺序、格式 | 数值差异 (17.48 vs 21.85) |
| Trafilatura_01 | 添加 metadata | - |
| PDFPlumber_02 | - | 缺失行的根本原因 |

**注意**: 修复需要 audit loop，单次执行无法自我纠错。

#### Q3: SIFU DNA-first 起了什么作用？

**答案: 中性偏负面。**

| 作用 | 说明 |
|------|------|
| **正面** | 强制记录决策，留下可审计的 spec |
| **负面** | 写了错误的 spec (如 NeuroKit_03 列顺序)，实现严格遵循错误 spec |
| **中性** | SIFU 不验证 spec 正确性，只验证 spec 存在 |

**核心问题**: DNA-first 假设 agent 能写出正确的 spec。但如果 agent 能力不足以理解任务需求，DNA 本身就会是错的。

#### Q4: 成功案例 vs 失败案例的本质区别

| 维度 | 成功 (Stegano_02, Scrapy_03) | 失败 (其他 3 个) |
|------|------------------------------|-----------------|
| **任务确定性** | 确定性高 (单一 API，固定输出) | 确定性低 (多种解法，格式歧义) |
| **spec 复杂度** | 简单 ("extract" + "save") | 复杂 (列顺序、metadata、行数) |
| **测试宽容度** | 宽松 (95% 阈值) | 严格 (75%-90% 阈值) |
| **工具依赖** | 库行为确定 (`lsb.reveal()`) | 库行为不确定 (pdfplumber 解析) |

**本质差异**: 成功案例是 **低歧义 + 高容错**，失败案例是 **高歧义 + 低容错**。

---

### Opus 结论

1. **SIFU 的价值不在于单次执行**。当前实验设计 (one-shot without feedback) 无法体现 SIFU 的核心价值 (可审计的 spec + 迭代修正)。

2. **DNA 质量 = Agent 能力**。弱模型写的 DNA 本身可能是错的。SIFU 保证的是 "有 DNA"，不是 "DNA 正确"。

3. **需要 audit loop 实验**。下一步应该测试: 给 agent test 结果反馈，让它根据 DNA 迭代修正，观察 SIFU 是否帮助定位问题。

4. **数据无误，原报告可信**。原始数据和统计正确，之前的 grep bug 已修复。

---

## 原始待验证问题 (已回答)

1. ~~失败是因为 DNA 写得不够具体，还是任务本身超出 Haiku 能力？~~ → 两者皆有，见上
2. ~~如果给 agent 测试反馈，能否修复这些错误？~~ → 格式可修，算法不确定
3. ~~SIFU 的 DNA-first 流程在这些失败中起了什么作用（正面/负面/中性）？~~ → 中性偏负
4. ~~成功案例 (Stegano_02, Scrapy_03) 和失败案例的本质区别是什么？~~ → 歧义度 + 容错度

---

## 附录: 关键 jsonl 差异

不同 test_script 使用不同的 key:

| Task | Result Key | 示例 |
|------|------------|------|
| Stegano_02 | `"Result"` | `{"Result": true}` |
| NeuroKit_03 | `"Result"` | `{"Result": false}` |
| Scrapy_03 | `"Results"` | `{"Results": true}` |
| Trafilatura_01 | `"Result"` | `{"Result": false}` |
| PDFPlumber_02 | `"Result"` | `{"Result": false}` |

这导致了最初的统计错误 (grep `"Result": true` 漏掉了 Scrapy_03)。
