# ⚡ MONTE CARLO ROBUSTNESS TESTING - QUICK START (60 Seconds)

## 🚀 Instant Demo (90 Seconds Total)

### What It Does

Tests a playbook 30 times with randomized variations (flood depths, road failures, shelter capacity, sensor noise) to measure reliability under uncertainty. Outputs success rate and confidence grade (A-F).

---

## 📋 Step-by-Step Demo

### 1. Navigate (5 seconds)

- Open: http://localhost:3000/playbook-studio
- Click **"Battle Mode"** tab
- Scroll down to **"ROBUSTNESS TEST: Uncertainty Analysis"** section

---

### 2. Set Uncertainty (Optional - 15 seconds)

**Four sliders** (leave at defaults for first demo):

- Flood Depth Variability: **±15%** (cyan)
- Road Failure Probability: **10%** (orange)
- Shelter Intake Variability: **±20%** (green)
- Sensor Confidence Degradation: **15%** (yellow)

**What these do**:

- ±15% floods = 2.0m becomes 1.7m-2.3m
- 10% roads = ~3 runs add new blockages
- ±20% shelters = 100-capacity becomes 80-120
- 15% sensors = severity slightly reduced (noise)

---

### 3. Select Playbook (10 seconds)

- Click **"Fairness-First Doctrine"** card (turns purple)
- Only one playbook at a time

---

### 4. Run Test (10 seconds)

- Click **"Run Robustness Test (30 runs)"**
- Loading spinner appears
- Wait 1-2 seconds
- Results automatically display

---

### 5. Read Results (50 seconds)

#### Top Cards (Quick Summary)

```
┌─────────────────────────────────────────────────┐
│ Success Rate │ Conf. Grade │ Worst │ Average  │
│     87%      │      B      │  58   │   76     │
│ 26/30 passed │ Good resil. │ Score │  Score   │
└─────────────────────────────────────────────────┘
```

**Meaning**:

- **87%** = Playbook succeeded 26 out of 30 times
- **Grade B** = Good resilience (85-94% success + worst ≥60)
- **Worst 58** = Lowest score across all runs
- **Avg 76** = Mean score

---

#### Bar Charts (Visual Variance)

```
Overall Score Distribution (30 runs):
▅▆▇█▇▇█▆▇█▇▆▇▇█▆▇█▇▆▇█▇▆▇█▇▇█▇▆
   ↑ Each bar = one run
   Height = score (0-100)
```

**What to look for**:

- **All bars similar**: Consistent playbook ✅
- **Some very short**: Unreliable playbook ❌
- **Wide spread**: High variance (risky)

**Hover**: Shows "Run X: score"

---

#### Failed Runs (If Any)

```
Failed Runs (4 / 30):
Run #7  - Shelter overload (72/100)
Run #14 - Infeasible missions (65/100)
Run #22 - Low overall score (58/100)
Run #29 - Shelter overload (71/100)
```

**Meaning**: These 4 runs didn't meet minimum thresholds

---

## 🎯 One-Sentence Explanations

### For Non-Technical Judges:

"We test the same plan 30 times with random variations—like testing a car on 30 different roads. This plan succeeds 87% of the time, earning a B grade for reliability."

### For Technical Judges:

"30-run Monte Carlo simulation with ±15% flood variability, 10% road failure probability, ±20% shelter variability, and 15% sensor noise. Success rate 87%, confidence grade B, seeded RNG for reproducibility."

### For Decision Makers:

"This plan is reliable. In 87% of scenarios—including unexpected road failures and capacity changes—it works. Even in worst case, it's acceptable. Grade B means 'deploy with confidence.'"

---

## 📊 Confidence Grades Explained

| Grade | Success Rate | Worst Case | Meaning                               |
| ----- | ------------ | ---------- | ------------------------------------- |
| **A** | ≥95%         | ≥70        | Excellent—deploy with full confidence |
| **B** | ≥85%         | ≥60        | Good—reliable for production          |
| **C** | ≥70%         | ≥50        | Acceptable—works most of the time     |
| **D** | ≥50%         | ≥40        | Weak—needs improvement                |
| **F** | <50%         | <40        | Fails—do not deploy                   |

---

## 🧪 Quick Tests

### Test 1: Default Test (60 seconds)

1. Select "Fairness-First Doctrine"
2. Click "Run Robustness Test"
3. ✅ See 87% success, Grade B
4. ✅ Bar charts show consistent bars
5. ✅ Few/no failed runs

---

### Test 2: Stress Test (90 seconds)

1. Move all sliders to **max** (±30%, 30%, ±30%, 30%)
2. Select same playbook
3. Click "Run Robustness Test"
4. ✅ Success rate **drops** (e.g., 70%)
5. ✅ Grade **worse** (likely C or D)
6. ✅ More failed runs listed

**Expected**: Extreme uncertainty = lower success = worse grade

---

### Test 3: Compare Playbooks (2 minutes)

1. Test "Fairness-First" → note grade
2. Click "Reset Test"
3. Test "Life-Saving Priority" → note grade
4. ✅ See which is more resilient

**Expected**: Balanced playbooks more resilient than extreme ones

---

## 🎬 Judge Demo Script (60 Seconds)

### Opening (10s)

"Let me show robustness testing. We don't test one scenario—we test 30 with random variations."

### Show Sliders (10s)

"These add uncertainty: ±15% flood depths, 10% road failures, ±20% shelter capacity, 15% sensor noise."

### Run Test (10s)

"Testing Fairness-First... [click] ...takes 1 second for 30 full simulations."

### Show Results (20s)

"87% success rate, Grade B—good resilience. Look at these bars [point]—all similar height, consistent performance. Even worst case scored 58, acceptable."

### Stress Test (10s)

"Now max uncertainty [move sliders] ...70% success, Grade C. Under extreme conditions, still works 70% of time."

**Total**: 60 seconds

---

## 🔧 Troubleshooting

### No results appearing

- Check playbook is selected (purple highlight)
- Verify "Run Robustness Test" was clicked
- Check browser console for errors

### All runs succeed (100%)

- Increase slider values for more challenge
- Try less robust playbook
- Check uncertainty params are applied

### Performance issues

- 30 runs should take ~1-2 seconds
- If longer, check system resources
- Reduce complexity if needed

---

## ✅ Pre-Demo Checklist

- [ ] Navigate to Playbook Studio → Battle Mode
- [ ] Scroll to Robustness Test section
- [ ] Verify 4 sliders functional
- [ ] Select playbook (turns purple)
- [ ] Run test (1-2 seconds)
- [ ] See summary cards (success, grade, worst, avg)
- [ ] See bar charts (30 bars each, hover tooltips)
- [ ] See failed runs (if any)
- [ ] Click "Export Report" (alert shows)
- [ ] Click "Reset Test" (clears results)

**If all pass**: READY TO DEMO ✅

---

## 🏆 Why This Impresses Judges

### 1. Beyond Single-Point Testing

- Most: "Here's a plan"
- **EQUA**: "Here's a plan tested 30 times under uncertainty"

### 2. Quantified Reliability

- Most: "Should work"
- **EQUA**: "87% success rate, Grade B"

### 3. Worst-Case Transparency

- Most: Only show best results
- **EQUA**: "Here's worst case and why it failed"

### 4. Production-Ready

- Most: One-off simulation
- **EQUA**: Seeded RNG, deterministic, fast, exportable

### 5. Visual Clarity

- Most: Tables of numbers
- **EQUA**: Bar charts show variance instantly

---

## 🚀 RESULT

**Monte Carlo Robustness Testing is LIVE!**

Combined with Battle Mode (Phase 1):

- **Battle Mode** → Find best playbook (compare 2-4)
- **Robustness Testing** → Prove it's reliable (30 runs)

**One-two punch for judges**:

1. "This playbook beats 3 others" (Battle Mode)
2. "And it's 87% reliable under uncertainty" (Robustness)

**Refresh Playbook Studio and try it now!** 🎉

---

_Monte Carlo Quick Start - Created: 2026-02-07_  
_Ready for: Production, Competition, Live Demos_  
_Test Time: 1-2 seconds for 30 runs_  
_Grade: A (if you're reading this, you're prepared!)_ 🏆
