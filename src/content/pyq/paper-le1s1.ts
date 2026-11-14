import type { PyqPaper } from '../../types';
import { md } from '../md';
import { photoSolution } from './shared';

const paper: PyqPaper = {
  id: 'le1s1',
  title: 'Lab Evaluation 1, Set 1',
  exam: 'Lab Evaluation 1',
  year: 2026,
  month: '',
  set: 'Set 1',
  file: 'EMBEDDED_LAB_MATERIALS/LAB_EVAL_1_PAPERS/set_1.docx',
  maxMarks: 25,
  notes: 'The document gives no date; it is listed with the 2026 papers. Marks come from its rubric: 10 + 3 + 4 × 3 = 25.',
  questions: [
    {
      id: 'LE1S1-1',
      number: '1',
      text: md`Develop an embedded application using an STM32 microcontroller to simulate a Photo Storage System. The system allows a user to upload, download, and delete photos using push buttons while providing status indications through LEDs.

**Hardware Requirements**

- S2 switch connected to PA6 is used to upload a photo.
- Upload Status LED connected to PB9 indicates a successful upload.
- S1 switch connected to PB10 is used to download a photo.
- Download Status LED connected to PC14 indicates a successful download.
- User Key connected to PA0 is used to delete a photo.
- Memory Full LED connected to PC13 indicates that the storage device is full.

**Functional Requirements**

*Upload Operation* — When the S2 (PA6) switch is pressed, upload one photo to the storage device. If storage space is available, increment the photo count by one. After a successful upload, blink the PB9 LED five times and then turn it OFF.

*Download Operation* — When the S1 (PB10) switch is pressed, download one photo from the storage device. If at least one photo is available, blink the PC14 LED five times and then turn it OFF.

*Storage Capacity* — The storage device can hold a maximum of three photos. After three successful uploads, any further upload attempt shall not increase the photo count. Instead, the PC13 LED shall continuously blink to indicate that the storage memory is full.

*Delete Operation* — When the User Key (PA0) is pressed, delete one photo from the storage device, provided that at least one photo is stored. Decrement the photo count by one. If the storage was previously full, stop blinking the PC13 LED to indicate that storage space is available again.

Write an Embedded C program using direct register programming to implement the above functionality. Your program should: configure all required GPIO pins as inputs or outputs; read the status of the switches using the GPIO input registers; control the LEDs using the GPIO output registers; maintain a variable to track the number of stored photos.

PINS on KIT — Digital output: LED 1 at PC14 and LED 2 at PB9. Digital input: Switch S1 at PB10 and Switch S2 at PA6. Analog sources: POT at PA0 and LDR at PA1. STM32 Black Pill on-board USER LED at PC13 and User KEY at PA0.`,
      marks: 25,
      unit: 2,
      topics: ['leds-switches', 'gpio-registers', 'pull-resistors', 'bit-manipulation'],
      kind: 'program',
      solution: photoSolution(),
    },
  ],
};

export default paper;
