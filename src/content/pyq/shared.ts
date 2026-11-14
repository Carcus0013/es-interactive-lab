/**
 * Answer blocks reused by several PYQ papers (the same question was set more than once).
 * Not matched by the paper-*.ts glob.
 */
import { md } from '../md';
import { LIGHTING_CODE } from '../practicals/p17-smart-lighting';
import { FAN_CODE } from '../practicals/p18-smart-fan';
import { PHOTO_CODE } from '../practicals/p15-eval-photo-storage';
import { PARKING_CODE } from '../practicals/p16-eval-parking';

/* ------------------------------------------------------------------ */
/* Bit-band alias calculation                                          */
/* ------------------------------------------------------------------ */

const hex = (n: number) => '0x' + n.toString(16).toUpperCase().padStart(8, '0');

export function bitbandSolution(opts: { reg: number; bit: number; regName: string; derive?: string }) {
  const offset = opts.reg - 0x40000000;
  const times32 = offset * 32;
  const alias = 0x42000000 + times32 + opts.bit * 4;
  return md`### (i) Calculation

**Given:** register address = **${hex(opts.reg)}** (${opts.regName}), bit number = **${opts.bit}**, peripheral bit-band region base = 0x4000 0000, peripheral alias base = 0x4200 0000.

**Required:** the bit-band alias word address for bit ${opts.bit}.
${opts.derive ?? ''}
**Formula**

$$
byte_offset   = register_address − 0x4000 0000
alias_address = 0x4200 0000 + (byte_offset × 32) + (bit_number × 4)
$$

**Substitution and calculation**

| Step | Working | Result |
|---|---|---|
| Byte offset | ${hex(opts.reg)} − 0x40000000 | 0x${offset.toString(16).toUpperCase()} |
| × 32 (shift left by 5) | 0x${offset.toString(16).toUpperCase()} × 0x20 | 0x${times32.toString(16).toUpperCase()} |
| Bit × 4 | ${opts.bit} × 4 = ${opts.bit * 4} | 0x${(opts.bit * 4).toString(16).toUpperCase()} |
| Add to alias base | 0x42000000 + 0x${times32.toString(16).toUpperCase()} + 0x${(opts.bit * 4).toString(16).toUpperCase()} | **${hex(alias)}** |

**Answer:** bit ${opts.bit} of ${opts.regName} is aliased at **${hex(alias)}**.

~~~c
#define BIT_ALIAS  (*(volatile uint32_t *)${hex(alias)})
BIT_ALIAS = 1;      /* sets only bit ${opts.bit}   */
BIT_ALIAS = 0;      /* clears only bit ${opts.bit} */
~~~

**Concept check:** each byte of the bit-band region expands into 32 bytes of alias space (8 bits × one 4-byte word per bit), which is why the offset is multiplied by 32 and the bit number by 4. Only bit 0 of the value written to an alias word matters.
`;
}

export const BITBAND_WHY = md`### (ii) How bit-banding improves GPIO control in real-time applications

**Definition.** Bit-banding maps every bit of the bit-band region (the first 1 MB of SRAM at 0x2000 0000 and of peripherals at 0x4000 0000) to its own 32-bit word in an alias region (0x2200 0000 / 0x4200 0000). Writing 1 or 0 to the alias word sets or clears that one bit.

**Without bit-banding** a single-bit change is a **read-modify-write**: «LDR» the register, «ORR»/«BIC» the bit, «STR» it back — three instructions.

**With bit-banding** it is a single «STR» to the alias address; the bus matrix performs the read-modify-write in hardware as one **atomic** operation.

| Benefit | Why it matters in real time |
|---|---|
| Atomic | An interrupt cannot fire between the read and the write, so an ISR that changes another bit of the same ODR can never be overwritten (no race condition, no need to disable interrupts) |
| Faster, fewer instructions | One store instead of three; less code |
| Deterministic timing | Same number of cycles every time, so pin toggling is predictable |
| Bit reads too | Reading the alias returns 0 or 1 — handy for flags and input pins |

::diagram{bitband-map}

**Conclusion.** Bit-banding gives single-instruction, interrupt-safe control of individual GPIO pins, which makes real-time pin control reliable and fast. (On STM32 the GPIO BSRR register offers a similar atomic set/reset for port pins.)
`;

/* ------------------------------------------------------------------ */
/* Bitwise clear / set vs direct assignment                            */
/* ------------------------------------------------------------------ */

export function clearBitSolution(bit: number, compare: string) {
  const mask = 1 << bit;
  const inv = (~mask >>> 0).toString(16).toUpperCase();
  const before = 0xb5 | mask;
  const after = before & ~mask;
  return md`### (i) The statement

~~~c
REG &= ~(1U << ${bit});      /* clear bit ${bit} only */
~~~

**Working of the operation**

| Step | Value (32-bit) |
|---|---|
| «1U << ${bit}» | 0x${mask.toString(16).toUpperCase().padStart(8, '0')} — only bit ${bit} is 1 |
| «~(1U << ${bit})» | 0x${inv} — every bit is 1 except bit ${bit} |
| «REG & mask» | AND with 1 keeps a bit unchanged; AND with 0 forces it to 0 |

So bit ${bit} becomes 0 and every other bit keeps its previous state. It is a read-modify-write: the CPU reads REG, ANDs, and writes back.

**Example:** REG = 0x${before.toString(16).toUpperCase().padStart(2, '0')} (several features enabled). After «REG &= ~(1U << ${bit})» → **0x${after.toString(16).toUpperCase().padStart(2, '0')}**: only bit ${bit} changed.

### (ii) Comparison with «${compare}»

| | «REG &= ~(1U << ${bit})» | «${compare}» |
|---|---|---|
| Bits affected | Only bit ${bit} | All 32 bits overwritten with 0 |
| Other features | Stay enabled | Every feature controlled by REG is **disabled** |
| With the example 0x${before.toString(16).toUpperCase().padStart(2, '0')} | 0x${after.toString(16).toUpperCase().padStart(2, '0')} | 0x00 |
| Use | Changing one control bit | Only when resetting the whole register on purpose |

**Conclusion.** Masked bitwise operations are the safe way to change one bit of a shared control register; a direct assignment destroys the configuration held in the other bits (for example clearing MODER or a peripheral's enable bits).
`;
}

export function setBitSolution(bit: number, compare: string, compareValue: number) {
  const mask = 1 << bit;
  const before = bit === 6 ? 0x15 : 0x83;
  const after = before | mask;
  const hx = (n: number) => '0x' + n.toString(16).toUpperCase().padStart(2, '0');
  return md`### (i) The statement

~~~c
REG |= (1U << ${bit});       /* set bit ${bit} only */
~~~

**Working of the operation**

| Step | Value |
|---|---|
| «1U << ${bit}» | 0x${mask.toString(16).toUpperCase().padStart(8, '0')} — only bit ${bit} is 1 |
| «REG | mask» | OR with 0 keeps a bit unchanged; OR with 1 forces it to 1 |

So bit ${bit} becomes 1 and every other bit keeps its previous value (read-modify-write).

**Example:** REG = ${hx(before)} (bits already set). After «REG |= (1U << ${bit})» → **${hx(after)}**.

### (ii) Why it is safer than «${compare}»

| | «REG |= (1U << ${bit})» | «${compare}» |
|---|---|---|
| Result for REG = ${hx(before)} | ${hx(after)} | ${hx(compareValue)} |
| Bit ${bit} | Set | Set |
| Other bits | **Preserved** | **Cleared** — every feature that was enabled is switched off |

«${compare}» writes the whole 32-bit register: it sets bit ${bit} but silently clears all the bits that were already set. On a GPIO MODER, for example, it would turn other pins back into inputs; on a peripheral control register it would disable features such as the enable bit.

**Conclusion.** Use «|=» to set, «&= ~» to clear and «^=» to toggle a bit; reserve direct assignment for writing a complete, known value to the whole register.
`;
}

/* ------------------------------------------------------------------ */
/* Operating modes                                                     */
/* ------------------------------------------------------------------ */

export const THREAD_HANDLER = md`### (a) Thread mode vs Handler mode

| | Thread mode | Handler mode |
|---|---|---|
| Entered | On reset, and on return from an exception | Automatically when an exception or interrupt is taken |
| Runs | The application (main program, RTOS tasks) | Exception handlers / ISRs |
| Privilege | **Privileged or unprivileged** — chosen by CONTROL.nPRIV (bit 0) | **Always privileged** |
| Stack pointer | MSP or PSP (CONTROL.SPSEL, bit 1) | Always MSP |
| IPSR | 0 | Exception number of the active handler |

**Handler mode is the one used exclusively for privileged operations** — it can never run unprivileged.

::diagram{modes}

### (b) Can unprivileged software make itself privileged?

**No, not directly.** In unprivileged Thread mode a write to the CONTROL register («MSR CONTROL, R0») is ignored, so code cannot clear nPRIV for itself — otherwise the protection would be meaningless.

The only route is through an **exception**:

1. Unprivileged code executes «SVC #n» (supervisor call).
2. The processor enters **Handler mode**, which is privileged.
3. The SVC handler (trusted OS code) checks the request and may clear CONTROL.nPRIV.
4. On exception return, Thread mode continues — now privileged.

The opposite direction (privileged → unprivileged) is possible in software: set CONTROL.nPRIV = 1 with «MSR» followed by «ISB».
`;

/* ------------------------------------------------------------------ */
/* Link register                                                       */
/* ------------------------------------------------------------------ */

export const LR_ANSWER = md`**Definition.** The Link Register **LR (R14)** holds the **return address** of a subroutine (and, during exceptions, a special EXC_RETURN code).

**Working during a subroutine call**

1. «BL func» (Branch with Link): the processor writes the address of the instruction **after** the BL into LR (bit 0 = 1, marking Thumb state) and loads the address of «func» into the PC.
2. «func» runs.
3. «BX LR» returns: PC ← LR, so execution continues right after the BL.

~~~asm
        BL   delay        ; LR = address of next instruction, PC = delay
        ADDS R0, R0, #1   ; execution resumes here
        ...
delay   MOVS R1, #100
loop    SUBS R1, R1, #1
        BNE  loop
        BX   LR           ; return: PC = LR
~~~

**Nested calls.** BL overwrites LR, so a function that itself calls another function must save LR first:

~~~asm
outer   PUSH {R4, LR}     ; save return address on the stack
        BL   inner        ; LR now points back into outer
        POP  {R4, PC}     ; restore: popping LR's value straight into PC returns
~~~

**During exceptions** LR is loaded with an **EXC_RETURN** value (e.g. 0xFFFFFFF9 = return to Thread mode using MSP). «BX LR» with that value tells the hardware to unstack the registers and return from the exception.

**Advantage.** Using a register (not the stack) for the return address makes calls to leaf functions fast: no memory access is needed.
`;

/* ------------------------------------------------------------------ */
/* SysTick reload                                                      */
/* ------------------------------------------------------------------ */

export function systickSolution(cpuMHz: number) {
  const clk = (cpuMHz * 1e6) / 8;
  const counts = clk / 1000;
  const rvr = counts - 1;
  return md`### One function of SysTick

SysTick is a 24-bit **down-counter** built into the Cortex-M4 core. One function: it generates a **periodic interrupt (system tick)** — the time base for an RTOS scheduler, or for accurate delays and time-keeping on bare metal. (Other functions: delay generation by polling COUNTFLAG, measuring elapsed time.)

### Reload value calculation

**Given:** processor clock = ${cpuMHz} MHz, SysTick clock = processor clock / 8 (CLKSOURCE = 0), required period = 1 ms.

**Required:** SYST_RVR value.

**Formula**

$$
f_SysTick = f_CPU / 8
N = f_SysTick × T
SYST_RVR = N − 1
$$

The counter counts from RVR down to 0, and the transition to 0 takes one more clock, so RVR + 1 clocks make one period — hence the **− 1**.

**Substitution and calculation**

| Step | Working | Result |
|---|---|---|
| SysTick clock | ${cpuMHz} MHz / 8 | ${(clk / 1e6).toString()} MHz |
| Counts in 1 ms | ${(clk / 1e6).toString()} × 10^{6} × 1 × 10^{−3} | ${counts} |
| Reload value | ${counts} − 1 | **${rvr}** (0x${rvr.toString(16).toUpperCase()}) |

**Answer: SYST_RVR = ${rvr}** (fits easily in the 24-bit limit of 16 777 215).

~~~c
SysTick->LOAD = ${rvr};      /* ${counts} ticks of ${(clk / 1e6).toString()} MHz = 1 ms   */
SysTick->VAL  = 0;          /* clear current value         */
SysTick->CTRL = 0x3;        /* ENABLE + TICKINT, CLKSOURCE = 0 (AHB/8) */
~~~

**Concept check:** without the /8 prescaler (CLKSOURCE = 1) the value would be ${cpuMHz * 1000} − 1 = ${cpuMHz * 1000 - 1}.
`;
}

/* ------------------------------------------------------------------ */
/* Part B design questions                                             */
/* ------------------------------------------------------------------ */

export function lightingSolution(rubric: string, pc14Note: boolean) {
  return md`**Full walkthrough:** [P17 Smart Lighting — line-by-line explanation, animated flowchart and ADC simulation](/lab/p17-smart-lighting).

### Logic

Three independent behaviours, evaluated every 10 ms in a super-loop:

1. **Door sensor (PA0 → PC13).** PA0 has a pull-up, so it reads 0 while pressed (door open) → PC13 ON (PC13 is active-low: clear the bit). Released → PC13 OFF.
2. **Automatic lighting (PA1, ADC1 channel 1 → PB9).** The ADC runs in continuous mode; the latest value is compared with a threshold. Dark → PB9 ON, bright → PB9 OFF.
3. **Manual override (PB10 → PB9).** While PB10 is held the LDR is ignored. Each new press (a 1 → 0 edge) flips PB9's state; releasing PB10 hands control back to the LDR.
${pc14Note ? '\nThe question lists an LED on PC14 but gives it no behaviour, so the solution keeps it OFF.\n' : ''}
### Register configuration

| Register | Setting | Purpose |
|---|---|---|
| RCC_AHB1ENR | bits 0, 1, 2 = 1 | Clock GPIOA, GPIOB, GPIOC |
| RCC_APB2ENR | bit 8 = 1 | Clock ADC1 |
| GPIOA_MODER | bits 1:0 = 00, bits 3:2 = 11 | PA0 input, PA1 analog |
| GPIOA_PUPDR | bits 1:0 = 01 | Pull-up on PA0 |
| GPIOB_MODER | bits 21:20 = 00, bits 19:18 = 01 | PB10 input, PB9 output |
| GPIOB_PUPDR | bits 21:20 = 01 | Pull-up on PB10 |
| GPIOC_MODER | bits 27:26 = 01 | PC13 output |
| ADC1_SMPR2 / ADC_CCR / CR1 | 0 | 3-cycle sampling, PCLK2/2, 12-bit |
| ADC1_SQR3 / SQR1 | 1 / 0 | One conversion of channel 1 |
| ADC1_CR2 | CONT, ADON, then SWSTART | Start continuous conversion |

### Code

~~~c
${LIGHTING_CODE}
~~~

### Explanation

- **Lines 3–6** put the threshold and the darkness test in one macro. If your LDR divider reads lower in the dark, flip the comparison there.
- **Lines 27–55** configure clocks, pins and the ADC in the order the lab programs use.
- **Lines 59–62** make PC13 follow the door switch.
- **Lines 65–66** copy the newest ADC result only when EOC is set, so the loop never blocks.
- **Lines 69–73** detect a new press of PB10 and choose the opposite of PB9's current state.
- **Lines 75–83** apply either the manual state (override held) or the LDR decision.
- **Line 85** paces the loop at 10 ms, which also debounces both switches.

### Expected output

| Situation | PC13 | PB9 |
|---|---|---|
| Door switch pressed | ON | — |
| Door switch released | OFF | — |
| Dark, PB10 released | — | ON |
| Bright, PB10 released | — | OFF |
| PB10 pressed (and held) | — | Opposite of its previous state, held while PB10 is held |
| PB10 released | — | Returns to LDR control |

### Flowchart

~~~text
START → enable clocks → configure PA0, PB10 (input + pull-up), PA1 (analog), PC13, PB9 (output)
      → configure ADC1 ch1 continuous → SWSTART
LOOP: PA0 == 0 ? PC13 ON : PC13 OFF
      EOC ? adcData = ADC1->DR
      new PB10 press ? manual = !PB9
      PB10 held ? PB9 = manual : PB9 = (adcData dark ? ON : OFF)
      delay 10 ms → LOOP
~~~

### Demonstrating for the rubric

Run in Keil debug mode, add «adcData» to the Watch window, cover and uncover the LDR, and show the value crossing the threshold as PB9 switches; then show each switch.

${rubric}
`;
}

export function fanSolution(rubric: string) {
  return md`**Full walkthrough:** [P18 Smart Fan — line-by-line explanation, animated flowchart and ADC simulation](/lab/p18-smart-fan).

### Logic

The fan switch has **priority** over everything else, so it is tested first in every 10 ms loop:

1. **PA6 released (fan OFF):** PC13, PB9 and PC14 all OFF — the pot and override are ignored, as the question insists.
2. **PA6 pressed (fan ON):** PC13 ON (active-low: clear bit 13). Then:
   - **PB10 held (override):** PB9 steady ON and PC14 ON.
   - **PB10 released (automatic):** PC14 OFF; the potentiometer (ADC1 channel 0, PA0) chooses the band: below 2048 → slow blink (toggle every 500 ms), 2048 and above → fast blink (toggle every 100 ms).

The blink is generated with a software counter that adds 10 ms per loop, so the switches are still read every 10 ms (no 500 ms blocking delay).

### Register configuration

| Register | Setting | Purpose |
|---|---|---|
| RCC_AHB1ENR | bits 0, 1, 2 = 1 | Clock GPIOA, GPIOB, GPIOC |
| RCC_APB2ENR | bit 8 = 1 | Clock ADC1 |
| GPIOA_MODER | bits 13:12 = 00, bits 1:0 = 11 | PA6 input, PA0 analog |
| GPIOA_PUPDR | bits 13:12 = 01 | Pull-up on PA6 |
| GPIOB_MODER | bits 21:20 = 00, bits 19:18 = 01 | PB10 input, PB9 output |
| GPIOB_PUPDR | bits 21:20 = 01 | Pull-up on PB10 |
| GPIOC_MODER | bits 27:26 = 01, bits 29:28 = 01 | PC13 and PC14 outputs |
| ADC1_SQR3 / SQR1 | 0 / 0 | One conversion of channel 0 |
| ADC1_CR2 | CONT, ADON, then SWSTART | Continuous conversion |

### Code

~~~c
${FAN_CODE}
~~~

### Explanation

- **Lines 3–6** define the two bands: the split at mid-scale and the two half-periods (1 Hz and 5 Hz blink).
- **Lines 26–55** configure clocks, the two switch inputs, the analog pin, three outputs and the ADC.
- **Lines 58–62** read both switches and the latest conversion each loop.
- **Lines 64–69** handle fan OFF first, so the “importantly” clause always holds.
- **Lines 71–76** light PC13 and handle the override.
- **Lines 77–85** pick the band from «adcData» and toggle PB9 with «^=» when the half-period has elapsed.
- **Line 89** is the 10 ms time base.

### Expected output

| PA6 | PB10 | Pot | PC13 | PB9 | PC14 |
|---|---|---|---|---|---|
| Released | Any | Any | OFF | OFF | OFF |
| Pressed | Released | Low (< 2048) | ON | Slow blink | OFF |
| Pressed | Released | High (≥ 2048) | ON | Fast blink | OFF |
| Pressed | Pressed | Any | ON | Steady ON | ON |

### Flowchart

~~~text
START → enable clocks → PA6, PB10 input + pull-up; PA0 analog; PC13, PC14, PB9 output
      → ADC1 ch0 continuous → SWSTART
LOOP: read PA6, PB10; EOC ? adcData = ADC1->DR
      PA6 released ? all LEDs OFF
      else PC13 ON;
           PB10 held ? PB9 ON, PC14 ON
           else PC14 OFF; half = adcData < 2048 ? 500 : 100; toggle PB9 every 'half' ms
      delay 10 ms → LOOP
~~~

### Demonstrating for the rubric

Show «adcData» in the Keil Watch window while turning the pot across 2048 and point out the change in blink rate; then demonstrate override and the fan-OFF priority.

${rubric}
`;
}

export function photoSolution() {
  return md`**Full walkthrough:** [P15 Photo Storage — line-by-line explanation, animated flowchart and GPIO simulation](/lab/p15-eval-photo-storage).

### Logic

- A variable «photos» (0–3) tracks storage.
- Each switch is handled on its **press edge** (1 → 0), so holding a button counts once.
- **Upload (PA6):** if «photos < 3», increment and blink PB9 five times; if already 3, the count does not change and PC13 starts blinking continuously (memory full).
- **Download (PB10):** if «photos ≥ 1», blink PC14 five times (the photo stays stored — downloading copies it).
- **Delete (PA0 KEY):** if «photos ≥ 1», decrement; this also stops the memory-full blink.
- The PC13 blink is driven by a tick counter in the main loop so the switches keep being read.

### Pin and register configuration

| Pin | Role | MODER | PUPDR |
|---|---|---|---|
| PA6 (S2) | Upload | 00 input | 01 pull-up |
| PB10 (S1) | Download | 00 input | 01 pull-up |
| PA0 (KEY) | Delete | 00 input | 01 pull-up |
| PB9 (LED2) | Upload status | 01 output | — |
| PC14 (LED1) | Download status | 01 output | — |
| PC13 (user LED, active-low) | Memory full | 01 output | — |

Clocks: RCC_AHB1ENR bits 0, 1, 2 (GPIOA, GPIOB, GPIOC).

### Code

~~~c
${PHOTO_CODE}
~~~

### Expected output

| Action | photos | LEDs |
|---|---|---|
| Upload ×3 | 1, 2, 3 | PB9 blinks 5 times each time |
| 4th upload | 3 (unchanged) | PC13 blinks continuously |
| Download | unchanged | PC14 blinks 5 times (if photos ≥ 1) |
| Delete | −1 | PC13 stops blinking if it was full |
| Delete at 0 | 0 | nothing |

### Rubric (25 marks, as printed)

| Item | Marks |
|---|---|
| Compile the programs without errors with the correct functionality | 10 |
| Download the program and verified | 3 |
| Each of the functionality | 4 × 3 = 12 |
`;
}

export function parkingSolution() {
  return md`**Full walkthrough:** [P16 Smart Parking — line-by-line explanation, animated flowchart and GPIO simulation](/lab/p16-eval-parking).

### Logic

- A variable «vehicles» (0–5) tracks occupancy.
- Switches are handled on their **press edge** so each press is one vehicle.
- **Entry (PB10):** if «vehicles < 5», increment and blink PB9 three times; if the lot is full, do not increment and turn PC13 ON.
- **Exit (PA6):** if «vehicles ≥ 1», decrement and blink PC14 three times; PC13 OFF because a space is now free.
- **Status rule:** after every change PC13 = ON exactly when «vehicles == 5».
- **Reset (PA0 KEY):** «vehicles = 0», all LEDs OFF.

### Pin and register configuration

| Pin | Role | MODER | PUPDR |
|---|---|---|---|
| PB10 (S1) | Entry | 00 input | 01 pull-up |
| PA6 (S2) | Exit | 00 input | 01 pull-up |
| PA0 (KEY) | Reset | 00 input | 01 pull-up |
| PB9 (LED2) | Entry status | 01 output | — |
| PC14 (LED1) | Exit status | 01 output | — |
| PC13 (user LED, active-low) | Parking full | 01 output | — |

Clocks: RCC_AHB1ENR bits 0, 1, 2.

### Code

~~~c
${PARKING_CODE}
~~~

### Expected output

| Action | vehicles | LEDs |
|---|---|---|
| Entry ×5 | 1 … 5 | PB9 blinks 3 times each; PC13 ON at 5 |
| 6th entry | 5 (unchanged) | PC13 stays ON |
| Exit | −1 | PC14 blinks 3 times; PC13 OFF |
| Reset | 0 | all OFF |

### Rubric (25 marks, as printed)

| Item | Marks |
|---|---|
| Compile the programs without errors with the correct functionality | 10 |
| Download the program and verified | 3 |
| Each of the functionality | 4 × 3 = 12 |
`;
}

export const RUBRIC_2025 = md`### Rubric (30 marks)

| Criterion | Marks |
|---|---|
| Register Configurations | 10 |
| Logic Design | 5 |
| Implementation | 5 |
| Interfacing the Hardware | 5 |
| Output | 5 |`;
