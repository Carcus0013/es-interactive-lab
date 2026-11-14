import type { PyqPaper } from '../../types';
import { md } from '../md';
import { bitbandSolution, BITBAND_WHY, setBitSolution, LR_ANSWER, fanSolution, RUBRIC_2025 } from './shared';

const paper: PyqPaper = {
  id: 'mt25b',
  title: 'Mid-Term Aug 2025, Set B',
  exam: 'Mid-Term',
  year: 2025,
  month: 'August',
  set: 'Set B',
  file: "EMBEDDED_PYQ'S/23CSE304_MIDTERM_PYQS.pdf",
  duration: '2 hours',
  maxMarks: 50,
  notes: 'Second of the two August 2025 papers in the compiled PDF (no set label is printed; this platform calls it Set B). Part A (theory) is 20 marks and Part B (practical) is 30 marks.',
  questions: [
    {
      id: 'MT25B-1',
      number: '1',
      text: md`You are helping your team choose the right processor for two different devices: A smartwatch that needs to run on battery for many days. A desktop computer that runs heavy software like video editors and games. Your mentor mentions two types of processor designs: RISC (used in ARM Cortex) and CISC (used in Intel processors).

Based on this scenario: Explain the difference between RISC and CISC by comparing the ARM Cortex processor (used in the smartwatch) and a typical Intel processor (used in the desktop).`,
      marks: 2,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['mpu-mcu-dsp', 'thumb-isa'],
      kind: 'theory',
      solution: md`**Definition.** **RISC** (Reduced Instruction Set Computer) uses a small set of simple, fixed-length instructions that each finish in about one cycle. **CISC** (Complex Instruction Set Computer) uses a large set of complex, variable-length instructions, some doing several operations (e.g. memory access + arithmetic) in one instruction.

| Feature | RISC — ARM Cortex (smartwatch) | CISC — Intel x86 (desktop) |
|---|---|---|
| Instructions | Few, simple, fixed length (16/32-bit Thumb-2) | Many, complex, variable length (1–15 bytes) |
| Memory access | Load/store only: arithmetic works on registers | Arithmetic can operate directly on memory |
| Execution | Mostly one cycle, easy to pipeline (3-stage on M4) | Multi-cycle, decoded into micro-operations |
| Registers | Many general-purpose registers (R0–R12) | Fewer architectural registers |
| Hardware | Simple decoder → small die, **low power** | Complex decoder → large die, high power |
| Code size | Larger in principle; Thumb-2 keeps it compact | Dense code |

**Applying the scenario.** The smartwatch must run for days on a small battery, so the simple, low-power ARM RISC core is the right choice. The desktop is mains-powered and needs maximum performance for heavy software, which a complex high-clock CISC (x86) processor provides.`,
    },
    {
      id: 'MT25B-2',
      number: '2',
      text: md`Explain the functionalities of ARM Cortex M4 Core registers.`,
      marks: 4,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['m4-registers'],
      kind: 'theory',
      solution: md`**Definition.** The Cortex-M4 has a bank of sixteen 32-bit core registers R0–R15 plus special registers. All data processing happens in registers (load/store architecture).

::diagram{register-bank}

| Register | Function |
|---|---|
| **R0–R7** (low registers) | General purpose; accessible by all 16-bit Thumb instructions. R0–R3 pass function arguments and R0 returns the result (AAPCS) |
| **R8–R12** (high registers) | General purpose; accessible by 32-bit instructions and a few 16-bit ones. R12 is a scratch register |
| **R13 — SP** (stack pointer) | Points to the top of the stack. Banked: **MSP** (main, used after reset and by handlers) and **PSP** (process, used by RTOS tasks), selected by CONTROL.SPSEL. Used by PUSH/POP and exception stacking |
| **R14 — LR** (link register) | Holds the return address after «BL»; holds EXC_RETURN during exceptions |
| **R15 — PC** (program counter) | Address of the current instruction (reads as current + 4). Writing it causes a branch |
| **xPSR** | Combined program status: **APSR** (N, Z, C, V, Q flags and GE bits), **IPSR** (current exception number), **EPSR** (Thumb bit T, IT/ICI state) |
| **PRIMASK** | Bit 0 = 1 disables all configurable interrupts |
| **FAULTMASK** | Bit 0 = 1 disables everything except NMI |
| **BASEPRI** | Masks interrupts at or below a priority level |
| **CONTROL** | Bit 0 nPRIV (unprivileged Thread mode), bit 1 SPSEL (PSP in Thread mode), bit 2 FPCA (FPU context active) |

The M4 with FPU also has **S0–S31** (32 single-precision floating-point registers) and **FPSCR**.

**Conclusion.** General-purpose registers hold data, SP/LR/PC manage the stack, calls and program flow, and the special registers hold status, interrupt masking and privilege control.`,
    },
    {
      id: 'MT25B-3',
      number: '3',
      text: md`How does the ARM Cortex-M4 use the Link Register (LR) during subroutine calls?`,
      marks: 3,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['m4-registers', 'memory-instructions'],
      kind: 'theory',
      solution: LR_ANSWER,
    },
    {
      id: 'MT25B-4',
      number: '4',
      text: md`What information is stored in the Program Status Register (PSR) of the ARM Cortex-M4 processor? Explain the purpose of the condition flags used in decision making.`,
      marks: 3,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['m4-registers', 'alu-instructions'],
      kind: 'theory',
      solution: md`**Definition.** The Program Status Register (**xPSR**) is one 32-bit register made of three views that can also be accessed separately.

::diagram{xpsr}

| Part | Bits | Information |
|---|---|---|
| **APSR** (Application PSR) | 31–27, 19–16 | Condition flags **N, Z, C, V**, the saturation flag **Q**, and **GE[3:0]** for SIMD instructions |
| **IPSR** (Interrupt PSR) | 8–0 | Number of the exception being handled (0 = Thread mode, 15 = SysTick, 16+ = IRQs) |
| **EPSR** (Execution PSR) | 24, 26–25, 15–10 | **T** bit (always 1: Thumb state) and **ICI/IT** bits for interrupted multi-load instructions and IT blocks |

### Condition flags in decision making

| Flag | Meaning |
|---|---|
| N | Result negative (bit 31 = 1) |
| Z | Result zero |
| C | Unsigned carry out / no borrow |
| V | Signed overflow |

A compare or S-suffixed instruction sets the flags; a conditional branch or IT block then tests them:

~~~asm
        CMP   R1, R2        ; R1 − R2, updates N Z C V
        BEQ   same          ; Z = 1  → R1 == R2
        BHI   bigger_u      ; C = 1 and Z = 0 → R1 > R2 (unsigned)
        BGT   bigger_s      ; Z = 0 and N = V → R1 > R2 (signed)
~~~

This is how C «if», «while» and «for» statements are implemented in machine code.

**Conclusion.** The PSR records the arithmetic outcome (APSR), the current exception (IPSR) and the execution state (EPSR); the flags drive every decision the program makes.`,
    },
    {
      id: 'MT25B-5a',
      number: '5(a)',
      text: md`Apply the concept of bit-banding in ARM Cortex-M4 to control a GPIO pin using STM32F401CCU6.

i. Calculate the bit-band alias address for bit 6 of the register located at 0x40020014 (GPIO port output data register).

ii. Explain how bit-banding improves GPIO control in real-time applications.`,
      marks: 4,
      co: 'CO01',
      btl: 'BTL 3',
      unit: 1,
      topics: ['bit-banding', 'memory-map'],
      kind: 'mixed',
      solution: bitbandSolution({ reg: 0x40020014, bit: 6, regName: 'GPIOA_ODR' }) + '\n' + BITBAND_WHY,
    },
    {
      id: 'MT25B-5b',
      number: '5(b)',
      text: md`You are configuring a GPIO pin using a 32-bit register in STM32F401CCU6. Initially, some other bits in the register are already set. Write code to enable bit 6 without affecting the other bits, and explain why your approach is safer than using direct assignment. Support your explanation by comparing it with a case where REG = (1 << 6); is used.`,
      marks: 4,
      co: 'CO01',
      btl: 'BTL 3',
      unit: 2,
      topics: ['bit-manipulation', 'gpio-registers'],
      kind: 'mixed',
      solution: setBitSolution(6, 'REG = (1 << 6);', 0x40),
    },
    {
      id: 'MT25B-6',
      number: '6',
      text: md`Design and implement a Smart Fan Speed and Status Indicator system on an STM32F401CCU6 microcontroller. The hardware setup is as follows: a switch is connected to PA6 to act as the fan power control, a potentiometer is connected to ADC1 channel 0 to regulate fan speed, another switch is connected to PB10 for manual override, and LEDs are connected to PC13, PC14, and PB9 for system indication. The system must operate in the following manner:

a. when the switch on PA6 is pressed, it simulates turning the fan ON and the LED on PC13 should glow, while releasing the switch turns the fan OFF and the LED goes OFF.

b. The potentiometer reading determines the fan speed level, which should be indicated by the blinking frequency of PB9 with two bands only: slow blinking for low speed and fast blinking for high speed.

c. The manual override switch on PB10, when pressed, should force PB9 to stay steadily ON regardless of the potentiometer input, and simultaneously PC14 should glow steadily to indicate that override mode is active. Releasing PB10 must resume potentiometer-based automatic fan speed control. Importantly, if the fan is OFF (PA6 not pressed), both PB9 and PC14 must remain OFF irrespective of potentiometer or override input.

Rubrics: Register Configurations [10], Logic Design [5], Implementation [5], Interfacing the Hardware [5], Output [5].`,
      marks: 30,
      co: 'CO02',
      btl: 'BTL 3–4',
      unit: 2,
      topics: ['adc-stm32', 'leds-switches', 'gpio-registers', 'pull-resistors'],
      kind: 'program',
      solution: fanSolution(RUBRIC_2025),
    },
  ],
};

export default paper;
