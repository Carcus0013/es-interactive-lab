import type { PyqPaper } from '../../types';
import { md } from '../md';
import { parkingSolution } from './shared';

const paper: PyqPaper = {
  id: 'le1s2',
  title: 'Lab Evaluation 1, Set 2',
  exam: 'Lab Evaluation 1',
  year: 2026,
  month: '',
  set: 'Set 2',
  file: 'EMBEDDED_LAB_MATERIALS/LAB_EVAL_1_PAPERS/set_2.docx',
  maxMarks: 25,
  notes: 'The document gives no date; it is listed with the 2026 papers. Marks come from its rubric: 10 + 3 + 4 × 3 = 25.',
  questions: [
    {
      id: 'LE1S2-1',
      number: '1',
      text: md`Develop an embedded application using an STM32 microcontroller to simulate a Smart Vehicle Parking Management System. The system manages vehicle entry and exit, keeps track of available parking spaces, and provides visual indications using LEDs.

**Hardware Requirements**

- Entry switch (S1) connected to PB10 is used to simulate a vehicle entering the parking lot.
- Entry Status LED connected to PB9 indicates a successful vehicle entry.
- Exit switch (S2) connected to PA6 is used to simulate a vehicle leaving the parking lot.
- Exit Status LED connected to PC14 indicates a successful vehicle exit.
- Reset switch (User Key) connected to PA0 resets the parking system.
- Parking Full LED connected to PC13 indicates that all parking spaces are occupied.

**Functional Requirements**

*Vehicle Entry* — When the Entry switch (PB10) is pressed, one vehicle enters the parking lot. The parking lot can accommodate a maximum of five vehicles. If parking space is available: increment the vehicle count; blink the PB9 LED three times to indicate successful entry. If the parking lot is full: do not increment the vehicle count; turn ON the PC13 LED.

*Vehicle Exit* — When the Exit switch (PA6) is pressed: if at least one vehicle is present, decrement the vehicle count; blink the PC14 LED three times to indicate successful exit. If the parking lot was previously full, turn OFF the PC13 LED after a vehicle exits.

*Parking Status* — If the parking lot becomes full (five vehicles), the PC13 LED shall remain ON. If parking spaces become available, the PC13 LED shall remain OFF.

*System Reset* — When the User Key (PA0) is pressed: reset the vehicle count to zero; turn OFF all LEDs. The system shall be ready to accept new vehicles.

Write an Embedded C program using direct register programming to implement the above functionality. Your program should: configure all required GPIO pins as inputs or outputs; read the status of the switches using the GPIO input registers; control the LEDs using the GPIO output registers; maintain a variable to track the number of vehicles stored.

PINS on KIT — Digital output: LED 1 at PC14 and LED 2 at PB9. Digital input: Switch S1 at PB10 and Switch S2 at PA6. Analog sources: POT at PA0 and LDR at PA1. STM32 Black Pill on-board USER LED at PC13 and User KEY at PA0.`,
      marks: 25,
      unit: 2,
      topics: ['leds-switches', 'gpio-registers', 'pull-resistors', 'bit-manipulation'],
      kind: 'program',
      solution: parkingSolution(),
    },
  ],
};

export default paper;
