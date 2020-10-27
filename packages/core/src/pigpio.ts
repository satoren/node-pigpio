/* eslint-disable camelcase */
/**
 * pigpio
 *
 * Oritinal source by http://abyz.me.uk/rpi/pigpio/python.html
 * port by s
 * It is the same feature as the original except that all requests are asynchronous.
 */

import { createRequestParam } from './command/Commands'
import { createNotifySocket } from './NotifySocket'
import { RequestParam } from './Request'
import { createRequestSocket } from './RequestSocket'

export let exceptions = false
exceptions = true

export type Level = 0 | 1;

//  GPIO levels

export const OFF = 0
export const LOW = 0
export const CLEAR = 0

export const ON = 1
export const HIGH = 1
export const SET = 1

export const TIMEOUT = 2

//  GPIO edges

export const RISING_EDGE = 0
export const FALLING_EDGE = 1
export const EITHER_EDGE = 2
type EdgeType = typeof RISING_EDGE | typeof FALLING_EDGE | typeof EITHER_EDGE

//  GPIO modes

export const INPUT = 0
export const OUTPUT = 1
export const ALT0 = 4
export const ALT1 = 5
export const ALT2 = 6
export const ALT3 = 7
export const ALT4 = 3
export const ALT5 = 2

//  GPIO Pull Up Down

export const PUD_OFF = 0
export const PUD_DOWN = 1
export const PUD_UP = 2

//  script run status

export const PI_SCRIPT_INITING = 0
export const PI_SCRIPT_HALTED = 1
export const PI_SCRIPT_RUNNING = 2
export const PI_SCRIPT_WAITING = 3
export const PI_SCRIPT_FAILED = 4
type ScriptStatusType = typeof PI_SCRIPT_INITING | typeof PI_SCRIPT_HALTED | typeof PI_SCRIPT_RUNNING | typeof PI_SCRIPT_WAITING | typeof PI_SCRIPT_FAILED

// notification flags

export const NTFY_FLAGS_EVENT = 1 << 7
export const NTFY_FLAGS_ALIVE = 1 << 6
export const NTFY_FLAGS_WDOG = 1 << 5
export const NTFY_FLAGS_GPIO = 31

// wave modes
export const WAVE_MODE_ONE_SHOT = 0
export const WAVE_MODE_REPEAT = 1
export const WAVE_MODE_ONE_SHOT_SYNC = 2
export const WAVE_MODE_REPEAT_SYNC = 3
type WaveModeType = typeof WAVE_MODE_ONE_SHOT | typeof WAVE_MODE_REPEAT | typeof WAVE_MODE_ONE_SHOT_SYNC | typeof WAVE_MODE_REPEAT_SYNC

export const WAVE_NOT_FOUND = 9998 // Transmitted wave not found.
export const NO_TX_WAVE = 9999 // No wave being transmitted.

export const FILE_READ = 1
export const FILE_WRITE = 2
export const FILE_RW = 3

export const FILE_APPEND = 4
export const FILE_CREATE = 8
export const FILE_TRUNC = 16
export const FROM_START = 0
export const FROM_CURRENT = 1
export const FROM_END = 2

export const SPI_MODE_0 = 0
export const SPI_MODE_1 = 1
export const SPI_MODE_2 = 2
export const SPI_MODE_3 = 3

export const SPI_CPHA = 1 << 0
export const SPI_CPOL = 1 << 1

export const SPI_CS_HIGH_ACTIVE = 1 << 2

export const SPI_TX_LSBFIRST = 1 << 14
export const SPI_RX_LSBFIRST = 1 << 15

export const EVENT_BSC = 31

export interface Pulse {
    /** the GPIO to switch on at the start of the pulse. */
    gpio_on: number;
    /**  the GPIO to switch off at the start of the pulse. */
    gpio_off: number;
    /** the delay in microseconds before the next pulse. */
    delay: number;
}

export interface Event{
    tally(): number
    reset_tally(): void
    cancel(): void
}
export interface Callback{
    tally(): number
    reset_tally(): void
    cancel(): void
}

export interface pigpio {
    // ESSENTIAL

    /** Stop a Pi connection
     *
     * Release pigpio resources.
     * ```
      await pi.stop()
    * ```
    */
    stop(): Promise<void>;

    // BASIC

    /**
      Sets the GPIO mode.
      gpio:= 0-53.
      mode:= INPUT, OUTPUT, ALT0, ALT1, ALT2, ALT3, ALT4, ALT5.
      * ```
      await pi.set_mode( 4, pigpio.INPUT)  # GPIO  4 as input
      await pi.set_mode(17, pigpio.OUTPUT) # GPIO 17 as output
      await pi.set_mode(24, pigpio.ALT2)   # GPIO 24 as ALT2
      * ```
     *
    */
    set_mode(gpio: number, mode: number): Promise<number>;
    /**  Get a GPIO mode
     *
      Returns the GPIO mode.
      gpio:= 0-53.
      Returns a value as follows
      * ```
      0 = INPUT
      1 = OUTPUT
      2 = ALT5
      3 = ALT4
      4 = ALT0
      5 = ALT1
      6 = ALT2
      7 = ALT3
      * ```
      * ```
      console.log(await pi.get_mode(0))
      4
      * ```
    */
    get_mode(gpio: number): Promise<number>;
    /**  Set/clear GPIO pull up/down resistor */
    set_pull_up_down(gpio: number, pud: number): Promise<number>;
    /** Read a GPIO */
    read(gpio: number): Promise<number>;
    /**  Write a GPIO */
    write(gpio: number, level: Level): Promise<number>;

    // PWM (overrides servo commands on same GPIO)

    /**  Start/stop PWM pulses on a GPIO */
    set_PWM_dutycycle(user_gpio: number, dutycycle: number): Promise<number>;
    /** Set PWM frequency of a GPIO */
    set_PWM_frequency(user_gpio: number, frequency: number): Promise<number>;
    /** Configure PWM range of a GPIO */
    set_PWM_range(user_gpio: number, range: number): Promise<number>;
    /** Get PWM dutycycle set on a GPIO */
    get_PWM_dutycycle(user_gpio: number): Promise<number>;
    /** Get PWM frequency of a GPIO */
    get_PWM_frequency(user_gpio: number): Promise<number>;

    /** Get configured PWM range of a GPIO */
    get_PWM_range(user_gpio: number): Promise<number>;

    /** Get underlying PWM range for a GPIO */
    get_PWM_real_range(user_gpio: number): Promise<number>;

    // Servo (overrides PWM commands on same GPIO)*/

    /** Start/Stop servo pulses on a GPIO */
    set_servo_pulsewidth(
        user_gpio: number,
        pulsewidth: number
    ): Promise<number>;

    /** Get servo pulsewidth set on a GPIO */
    get_servo_pulsewidth(user_gpio: number): Promise<number>;

    // INTERMEDIATE

    /** Send a trigger pulse to a GPIO */
    gpio_trigger(
        user_gpio: number,
        pulse_len: number,
        level: Level
    ): Promise<number>;

    /** Set a watchdog on a GPIO */
    set_watchdog(
        user_gpio: number,
        pulse_len: number,
        level: Level
    ): Promise<number>;

    /** Read all bank 1 GPIO */
    read_bank_1(): Promise<number>;

    /** Read all bank 2 GPIO */
    read_bank_2(): Promise<number>;

    /** Clear selected GPIO in bank 1 */
    clear_bank_1(bits: number): Promise<number>;

    /** Clear selected GPIO in bank 2 */
    clear_bank_2(bits: number): Promise<number>;

    /** Set selected GPIO in bank 1 */
    set_bank_1(bits: number): Promise<number>;

    /** Set selected GPIO in bank 2 */
    set_bank_2(bits: number): Promise<number>;

    // Create GPIO level change callback*/
    callback(
        user_gpio: number,
        edge: typeof RISING_EDGE | typeof FALLING_EDGE | typeof EITHER_EDGE,
        func: (gpio: number, level: 0|1|'TIMEOUT', tick: number) => void
    ): Callback;

    // Wait for GPIO level change*/
    wait_for_edge(
        user_gpio: number,
        edge: typeof RISING_EDGE | typeof FALLING_EDGE | typeof EITHER_EDGE,
        wait_timeout: number
    ): Promise<boolean>;

    // ADVANCED

    /** Request a notification handle */
    notify_open(): Promise<number>;
    /** Start notifications for selected GPIO */
    notify_begin(handle: number, bits: number): Promise<number>;
    /** Pause notifications */
    notify_pause(handle: number): Promise<number>;

    /** Close a notification */
    notify_close(handle: number): Promise<number>;

    /** Start hardware clock on supported GPIO */
    hardware_clock(gpio: number, clkfreq: number): Promise<number>;

    /** Start hardware PWM on supported GPIO */
    hardware_PWM(
        gpio: number,
        PWMfreq: number,
        PWMduty: number
    ): Promise<number>;

    /** Set a glitch filter on a GPIO */
    set_glitch_filter(user_gpio: number, steady: number): Promise<number>;

    /** Set a noise filter on a GPIO */
    set_noise_filter(
        user_gpio: number,
        steady: number,
        active: number
    ): Promise<number>;

    /** Sets a pads drive strength */
    set_pad_strength(pad: number, pad_strength: number): Promise<number>;

    /** Gets a pads drive strength */
    get_pad_strength(pad: number): Promise<number>;

    /**  Executes a shell command */
    shell(shellscr: string, pstring: string): Promise<number>;

    // Custom

    /** User custom function 1 */
    custom_1(arg1?: number, arg2?: number, argx?: Buffer): Promise<number>;

    /** User custom function 2 */
    custom_2(
        arg1?: number,
        argx?: Buffer,
        retMax?: number
    ): Promise<[number, Buffer]>;

    // Events

    /** Sets a callback for an event */
    event_callback(
        event: number,
        func: (event: number, tick: number) => void
    ): Event;

    /** Triggers an event */
    event_trigger(event: number): Promise<number>;

    /** Wait for an event */
    wait_for_event(event: number, wait_timeout: number): Promise<boolean>;

    // Scripts

    /** Store a script */
    store_script(script: string): Promise<number>;

    /** Run a stored script */
    run_script(script_id: number, params: number[]): Promise<number>;

    /** Set a scripts parameters */
    update_script(script_id: number, params: number[]): Promise<number>;

    /** Get script status and parameters */
    script_status(script_id: number): Promise<[ScriptStatusType, number[]]>;
    /** Stop a running script */
    stop_script(script_id: number): Promise<number>;

    /** Delete a stored script */
    delete_script(script_id: number): Promise<number>;

    // I2C
    /** Opens an I2C device */
    i2c_open(
        i2c_bus: number,
        i2c_address: number,
        i2c_flags?: number
    ): Promise<number>;
    /** Closes an I2C device */
    i2c_close(handle: number): Promise<number>;
    /** SMBus write quick */
    i2c_write_quick(handle: number, bit: 0 | 1): Promise<number>;

    /** SMBus read byte */
    i2c_read_byte(handle: number): Promise<number>;

    /** SMBus write byte */
    i2c_write_byte(handle: number, byte_val: number): Promise<number>;

    /** SMBus read byte data */
    i2c_read_byte_data(handle: number, reg: number): Promise<number>;
    /** SMBus write byte data */
    i2c_write_byte_data(
        handle: number,
        reg: number,
        byte_val: number
    ): Promise<number>;

    /** SMBus read word data */
    i2c_read_word_data(handle: number, reg: number): Promise<number>;

    /** SMBus write word data */
    i2c_write_word_data(
        handle: number,
        reg: number,
        word_val: number
    ): Promise<number>;

    /** SMBus read block data */
    i2c_read_block_data(
        handle: number,
        reg: number
    ): Promise<[number, Buffer]>;

    // SMBus write block data*/
    i2c_write_block_data(
        handle: number,
        reg: number,
        data: Buffer
    ): Promise<number>;

    /** SMBus read I2C block data */
    i2c_read_i2c_block_data(
        handle: number,
        reg: number,
        count: number
    ): Promise<[number, Buffer]>;
    /** SMBus write I2C block data */
    i2c_write_i2c_block_data(
        handle: number,
        reg: number,
        data: Buffer
    ): Promise<number>;

    /** Reads the raw I2C device */
    i2c_read_device(
        handle: number,
        count: number
    ): Promise<[number, Buffer]>;

    /** Writes the raw I2C device */
    i2c_write_device(handle: number, data: Buffer): Promise<number>;

    /** SMBus process call */
    i2c_process_call(
        handle: number,
        reg: number,
        word_val: number
    ): Promise<number>;

    /**  SMBus block process call */
    i2c_block_process_call(
        handle: number,
        reg: number,
        data: Buffer
    ): Promise<[number, Buffer]>;

    /**  Performs multiple I2C transactions */
    i2c_zip(handle: number, data: Buffer): Promise<[number, Buffer]>;

    /** I2C BIT BANG

  /** Opens GPIO for bit banging I2C */
    bb_i2c_open(SDA: number, SCL: number, baud: number): Promise<number>;
    /** Closes GPIO for bit banging I2C */
    bb_i2c_close(SDA: number): Promise<number>;
    /** Performs multiple bit banged I2C transactions */
    bb_i2c_zip(SDA: number, data: Buffer): Promise<[number, Buffer]>;

    // I2C/SPI SLAVE

    /** I2C/SPI as slave transfer */
    bsc_xfer(
        bsc_control: number,
        data: Buffer
    ): Promise<[number, number, Buffer]>;

    /** I2C as slave transfer */
    bsc_i2c(
        i2c_address: number,
        data: Buffer
    ): Promise<[number, number, Buffer]>;

    // SERIAL
    /** Opens a serial device
     *
     */
    serial_open(tty: string, baud: number, ser_flags?: number): Promise<number>;

    /** Closes a serial device */
    serial_close(handle: number): Promise<number>;

    /** Reads a byte from a serial device */
    serial_read_byte(handle: number): Promise<number>;
    /** Writes a byte to a serial device */
    serial_write_byte(handle: number, byte_val: number): Promise<number>;

    /** Reads bytes from a serial device */
    serial_read(handle: number, count: number): Promise<[number, Buffer]>;
    /** Writes bytes to a serial device */
    serial_write(handle: number, data: Buffer): Promise<number>;

    /** Returns number of bytes ready to be read */
    serial_data_available(handle: number): Promise<number>;

    // SERIAL BIT BANG (read only)

    /** Open a GPIO for bit bang serial reads */
    bb_serial_read_open(
        user_gpio: number,
        baud: number,
        bb_bits: number
    ): Promise<number>;

    /** Close a GPIO for bit bang serial reads */
    bb_serial_read_close(user_gpio: number): Promise<number>;

    /** Invert serial logic (1 invert, 0 normal) */
    bb_serial_invert(user_gpio: number, invert: 0 | 1): Promise<number>;

    /** Read bit bang serial data from a GPIO */
    bb_serial_read(user_gpio: number): Promise<[number, Buffer]>;

    // SPI

    /** Opens a SPI device */
    spi_open(
        spi_channel: number,
        baud: number,
        spi_flags?: number
    ): Promise<number>;

    /** Closes a SPI device */
    spi_close(handle: number): Promise<number>;

    /** Reads bytes from a SPI device */
    spi_read(handle: number, count: number): Promise<[number, Buffer]>;

    /** Writes bytes to a SPI device */
    spi_write(handle: number, data: Buffer): Promise<number>;

    /** Transfers bytes with a SPI device */
    spi_xfer(handle: number, data: Buffer): Promise<[number, Buffer]>;

    // SPI BIT BANG

    /** Opens GPIO for bit banging SPI */
    bb_spi_open(
        CS: number,
        MISO: number,
        MOSI: number,
        SCLK: number,
        baud: number,
        spiFlags?: number
    ): Promise<number>;

    /** Closes GPIO for bit banging SPI */
    bb_spi_close(CS: number): Promise<number>;

    /** Transfers bytes with bit banging SPI */
    bb_spi_xfer(CS: number, data: Buffer): Promise<[number, Buffer]>;

    // FILES

    /** Opens a file */
    file_open(file_name: string, file_mode: number): Promise<number>;

    /** Closes a file */
    file_close(handle: number): Promise<number>;

    /** Reads bytes from a file */
    file_read(handle: number, count: number): Promise<[number, Buffer]>;

    /** Writes bytes to a file */
    file_write(handle: number, data: Buffer): Promise<number>;

    /** Seeks to a position within a file */
    file_seek(
        handle: number,
        seek_offset: number,
        seek_from: number
    ): Promise<number>;

    /** List files which match a pattern */
    file_list(file_name: string): Promise<[number, Buffer]>;

    // WAVES

    /** Deletes all waveforms */
    wave_clear(): Promise<number>;
    /** Starts a new waveform */
    wave_add_new(): Promise<number>;
    /** Adds a series of pulses to the waveform */
    wave_add_generic(pulses: Pulse[]): Promise<number>;

    /** Adds serial data to the waveform */
    wave_add_serial(
        user_gpio: number,
        baud: number,
        data: Buffer,
        offset?: number,
        bb_bits?: number,
        bb_stop?: number
    ): Promise<number>;

    /** Creates a waveform from added data */
    wave_create(): Promise<number>;

    /** Creates a waveform of fixed size from added data */
    wave_create_and_pad(percent: number): Promise<number>;

    /** Deletes a waveform */
    wave_delete(wave_id: number): Promise<number>;

    /** Transmits a waveform once */
    wave_send_once(wave_id: number): Promise<number>;

    /** Transmits a waveform repeatedly */
    wave_send_repeat(wave_id: number): Promise<number>;

    /** Transmits a waveform in the chosen mode */
    wave_send_using_mode(wave_id: number, mode: WaveModeType): Promise<number>;

    /**  Transmits a chain of waveforms */
    wave_chain(data: Buffer): Promise<number>;

    /** Returns the current transmitting waveform */
    wave_tx_at(): Promise<number>;

    /** Checks to see if a waveform has ended */
    wave_tx_busy(): Promise<number>;

    /** Aborts the current waveform */
    wave_tx_stop(): Promise<number>;

    /** Length in cbs of the current waveform */
    wave_get_cbs(): Promise<number>;

    /** Absolute maximum allowed cbs */
    wave_get_max_cbs(): Promise<number>;
    /** Length in microseconds of the current waveform */
    wave_get_micros(): Promise<number>;
    /** Absolute maximum allowed micros */
    wave_get_max_micros(): Promise<number>;
    /** Length in pulses of the current waveform */
    wave_get_pulses(): Promise<number>;
    /** Absolute maximum allowed pulses */
    wave_get_max_pulses(): Promise<number>;
    // UTILITIES

    /** Get current tick (microseconds) */
    get_current_tick(): Promise<number>;
    /** Get hardware revision */
    get_hardware_revision(): Promise<number>;
    /** Get the pigpio version */
    get_pigpio_version(): Promise<number>;

    /** true if a connection was established, false otherwise. */
    connected: boolean;
}

// pigpio error numbers

const _PI_INIT_FAILED = -1
export const PI_BAD_USER_GPIO = -2
export const PI_BAD_GPIO = -3
export const PI_BAD_MODE = -4
export const PI_BAD_LEVEL = -5
export const PI_BAD_PUD = -6
export const PI_BAD_PULSEWIDTH = -7
export const PI_BAD_DUTYCYCLE = -8
const _PI_BAD_TIMER = -9
const _PI_BAD_MS = -10
const _PI_BAD_TIMETYPE = -11
const _PI_BAD_SECONDS = -12
const _PI_BAD_MICROS = -13
const _PI_TIMER_FAILED = -14
export const PI_BAD_WDOG_TIMEOUT = -15
const _PI_NO_ALERT_FUNC = -16
const _PI_BAD_CLK_PERIPH = -17
const _PI_BAD_CLK_SOURCE = -18
const _PI_BAD_CLK_MICROS = -19
const _PI_BAD_BUF_MILLIS = -20
export const PI_BAD_DUTYRANGE = -21
const _PI_BAD_SIGNUM = -22
const _PI_BAD_PATHNAME = -23
export const PI_NO_HANDLE = -24
export const PI_BAD_HANDLE = -25
const _PI_BAD_IF_FLAGS = -26
const _PI_BAD_CHANNEL = -27
const _PI_BAD_PRIM_CHANNEL = -27
const _PI_BAD_SOCKET_PORT = -28
const _PI_BAD_FIFO_COMMAND = -29
const _PI_BAD_SECO_CHANNEL = -30
const _PI_NOT_INITIALISED = -31
const _PI_INITIALISED = -32
const _PI_BAD_WAVE_MODE = -33
const _PI_BAD_CFG_INTERNAL = -34
export const PI_BAD_WAVE_BAUD = -35
export const PI_TOO_MANY_PULSES = -36
export const PI_TOO_MANY_CHARS = -37
export const PI_NOT_SERIAL_GPIO = -38
const _PI_BAD_SERIAL_STRUC = -39
const _PI_BAD_SERIAL_BUF = -40
export const PI_NOT_PERMITTED = -41
export const PI_SOME_PERMITTED = -42
export const PI_BAD_WVSC_COMMND = -43
export const PI_BAD_WVSM_COMMND = -44
export const PI_BAD_WVSP_COMMND = -45
export const PI_BAD_PULSELEN = -46
export const PI_BAD_SCRIPT = -47
export const PI_BAD_SCRIPT_ID = -48
export const PI_BAD_SER_OFFSET = -49
export const PI_GPIO_IN_USE = -50
export const PI_BAD_SERIAL_COUNT = -51
export const PI_BAD_PARAM_NUM = -52
export const PI_DUP_TAG = -53
export const PI_TOO_MANY_TAGS = -54
export const PI_BAD_SCRIPT_CMD = -55
export const PI_BAD_VAR_NUM = -56
export const PI_NO_SCRIPT_ROOM = -57
export const PI_NO_MEMORY = -58
export const PI_SOCK_READ_FAILED = -59
export const PI_SOCK_WRIT_FAILED = -60
export const PI_TOO_MANY_PARAM = -61
export const PI_SCRIPT_NOT_READY = -62
export const PI_BAD_TAG = -63
export const PI_BAD_MICS_DELAY = -64
export const PI_BAD_MILS_DELAY = -65
export const PI_BAD_WAVE_ID = -66
export const PI_TOO_MANY_CBS = -67
export const PI_TOO_MANY_OOL = -68
export const PI_EMPTY_WAVEFORM = -69
export const PI_NO_WAVEFORM_ID = -70
export const PI_I2C_OPEN_FAILED = -71
export const PI_SER_OPEN_FAILED = -72
export const PI_SPI_OPEN_FAILED = -73
export const PI_BAD_I2C_BUS = -74
export const PI_BAD_I2C_ADDR = -75
export const PI_BAD_SPI_CHANNEL = -76
export const PI_BAD_FLAGS = -77
export const PI_BAD_SPI_SPEED = -78
export const PI_BAD_SER_DEVICE = -79
export const PI_BAD_SER_SPEED = -80
export const PI_BAD_PARAM = -81
export const PI_I2C_WRITE_FAILED = -82
export const PI_I2C_READ_FAILED = -83
export const PI_BAD_SPI_COUNT = -84
export const PI_SER_WRITE_FAILED = -85
export const PI_SER_READ_FAILED = -86
export const PI_SER_READ_NO_DATA = -87
export const PI_UNKNOWN_COMMAND = -88
export const PI_SPI_XFER_FAILED = -89
const _PI_BAD_POINTER = -90
export const PI_NO_AUX_SPI = -91
export const PI_NOT_PWM_GPIO = -92
export const PI_NOT_SERVO_GPIO = -93
export const PI_NOT_HCLK_GPIO = -94
export const PI_NOT_HPWM_GPIO = -95
export const PI_BAD_HPWM_FREQ = -96
export const PI_BAD_HPWM_DUTY = -97
export const PI_BAD_HCLK_FREQ = -98
export const PI_BAD_HCLK_PASS = -99
export const PI_HPWM_ILLEGAL = -100
export const PI_BAD_DATABITS = -101
export const PI_BAD_STOPBITS = -102
export const PI_MSG_TOOBIG = -103
export const PI_BAD_MALLOC_MODE = -104
const _PI_TOO_MANY_SEGS = -105
const _PI_BAD_I2C_SEG = -106
export const PI_BAD_SMBUS_CMD = -107
export const PI_NOT_I2C_GPIO = -108
export const PI_BAD_I2C_WLEN = -109
export const PI_BAD_I2C_RLEN = -110
export const PI_BAD_I2C_CMD = -111
export const PI_BAD_I2C_BAUD = -112
export const PI_CHAIN_LOOP_CNT = -113
export const PI_BAD_CHAIN_LOOP = -114
export const PI_CHAIN_COUNTER = -115
export const PI_BAD_CHAIN_CMD = -116
export const PI_BAD_CHAIN_DELAY = -117
export const PI_CHAIN_NESTING = -118
export const PI_CHAIN_TOO_BIG = -119
export const PI_DEPRECATED = -120
export const PI_BAD_SER_INVERT = -121
const _PI_BAD_EDGE = -122
const _PI_BAD_ISR_INIT = -123
export const PI_BAD_FOREVER = -124
export const PI_BAD_FILTER = -125
export const PI_BAD_PAD = -126
export const PI_BAD_STRENGTH = -127
export const PI_FIL_OPEN_FAILED = -128
export const PI_BAD_FILE_MODE = -129
export const PI_BAD_FILE_FLAG = -130
export const PI_BAD_FILE_READ = -131
export const PI_BAD_FILE_WRITE = -132
export const PI_FILE_NOT_ROPEN = -133
export const PI_FILE_NOT_WOPEN = -134
export const PI_BAD_FILE_SEEK = -135
export const PI_NO_FILE_MATCH = -136
export const PI_NO_FILE_ACCESS = -137
export const PI_FILE_IS_A_DIR = -138
export const PI_BAD_SHELL_STATUS = -139
export const PI_BAD_SCRIPT_NAME = -140
export const PI_BAD_SPI_BAUD = -141
export const PI_NOT_SPI_GPIO = -142
export const PI_BAD_EVENT_ID = -143
export const PI_CMD_INTERRUPTED = -144
export const PI_NOT_ON_BCM2711 = -145
export const PI_ONLY_ON_BCM2711 = -146

/**  Gets error text from error number */
export function error_text (errnum: number): string {
    const errorMessages: Record<number, string> = {
        [_PI_INIT_FAILED]: 'pigpio initialisation failed',
        [PI_BAD_USER_GPIO]: 'GPIO not 0-31',
        [PI_BAD_GPIO]: 'GPIO not 0-53',
        [PI_BAD_MODE]: 'mode not 0-7',
        [PI_BAD_LEVEL]: 'level not 0-1',
        [PI_BAD_PUD]: 'pud not 0-2',
        [PI_BAD_PULSEWIDTH]: 'pulsewidth not 0 or 500-2500',
        [PI_BAD_DUTYCYCLE]: 'dutycycle not 0-range (default 255)',
        [_PI_BAD_TIMER]: 'timer not 0-9',
        [_PI_BAD_MS]: 'ms not 10-60000',
        [_PI_BAD_TIMETYPE]: 'timetype not 0-1',
        [_PI_BAD_SECONDS]: 'seconds < 0',
        [_PI_BAD_MICROS]: 'micros not 0-999999',
        [_PI_TIMER_FAILED]: 'gpioSetTimerFunc failed',
        [PI_BAD_WDOG_TIMEOUT]: 'timeout not 0-60000',
        [_PI_NO_ALERT_FUNC]: 'DEPRECATED',
        [_PI_BAD_CLK_PERIPH]: 'clock peripheral not 0-1',
        [_PI_BAD_CLK_SOURCE]: 'DEPRECATED',
        [_PI_BAD_CLK_MICROS]: 'clock micros not 1, 2, 4, 5, 8, or 10',
        [_PI_BAD_BUF_MILLIS]: 'buf millis not 100-10000',
        [PI_BAD_DUTYRANGE]: 'dutycycle range not 25-40000',
        [_PI_BAD_SIGNUM]: 'signum not 0-63',
        [_PI_BAD_PATHNAME]: "can't open pathname",
        [PI_NO_HANDLE]: 'no handle available',
        [PI_BAD_HANDLE]: 'unknown handle',
        [_PI_BAD_IF_FLAGS]: 'ifFlags > 4',
        [_PI_BAD_CHANNEL]: 'DMA channel not 0-14',
        [_PI_BAD_PRIM_CHANNEL]: 'DMA primary channel not 0-15',
        [_PI_BAD_SOCKET_PORT]: 'socket port not 1024-30000',
        [_PI_BAD_FIFO_COMMAND]: 'unknown fifo command',
        [_PI_BAD_SECO_CHANNEL]: 'DMA secondary channel not 0-14',
        [_PI_NOT_INITIALISED]: 'function called before gpioInitialise',
        [_PI_INITIALISED]: 'function called after gpioInitialise',
        [_PI_BAD_WAVE_MODE]: 'waveform mode not 0-1',
        [_PI_BAD_CFG_INTERNAL]: 'bad parameter in gpioCfgInternals call',
        [PI_BAD_WAVE_BAUD]: 'baud rate not 50-250K(RX)/50-1M(TX)',
        [PI_TOO_MANY_PULSES]: 'waveform has too many pulses',
        [PI_TOO_MANY_CHARS]: 'waveform has too many chars',
        [PI_NOT_SERIAL_GPIO]: 'no bit bang serial read in progress on GPIO',
        [_PI_BAD_SERIAL_STRUC]: 'bad (null) serial structure parameter',
        [_PI_BAD_SERIAL_BUF]: 'bad (null) serial buf parameter',
        [PI_NOT_PERMITTED]: 'no permission to update GPIO',
        [PI_SOME_PERMITTED]: 'no permission to update one or more GPIO',
        [PI_BAD_WVSC_COMMND]: 'bad WVSC subcommand',
        [PI_BAD_WVSM_COMMND]: 'bad WVSM subcommand',
        [PI_BAD_WVSP_COMMND]: 'bad WVSP subcommand',
        [PI_BAD_PULSELEN]: 'trigger pulse length not 1-100',
        [PI_BAD_SCRIPT]: 'invalid script',
        [PI_BAD_SCRIPT_ID]: 'unknown script id',
        [PI_BAD_SER_OFFSET]: 'add serial data offset > 30 minute',
        [PI_GPIO_IN_USE]: 'GPIO already in use',
        [PI_BAD_SERIAL_COUNT]: 'must read at least a byte at a time',
        [PI_BAD_PARAM_NUM]: 'script parameter id not 0-9',
        [PI_DUP_TAG]: 'script has duplicate tag',
        [PI_TOO_MANY_TAGS]: 'script has too many tags',
        [PI_BAD_SCRIPT_CMD]: 'illegal script command',
        [PI_BAD_VAR_NUM]: 'script variable id not 0-149',
        [PI_NO_SCRIPT_ROOM]: 'no more room for scripts',
        [PI_NO_MEMORY]: "can't allocate temporary memory",
        [PI_SOCK_READ_FAILED]: 'socket read failed',
        [PI_SOCK_WRIT_FAILED]: 'socket write failed',
        [PI_TOO_MANY_PARAM]: 'too many script parameters (> 10)',
        [PI_SCRIPT_NOT_READY]: 'script initialising',
        [PI_BAD_TAG]: 'script has unresolved tag',
        [PI_BAD_MICS_DELAY]: 'bad MICS delay (too large)',
        [PI_BAD_MILS_DELAY]: 'bad MILS delay (too large)',
        [PI_BAD_WAVE_ID]: 'non existent wave id',
        [PI_TOO_MANY_CBS]: 'No more CBs for waveform',
        [PI_TOO_MANY_OOL]: 'No more OOL for waveform',
        [PI_EMPTY_WAVEFORM]: 'attempt to create an empty waveform',
        [PI_NO_WAVEFORM_ID]: 'no more waveform ids',
        [PI_I2C_OPEN_FAILED]: "can't open I2C device",
        [PI_SER_OPEN_FAILED]: "can't open serial device",
        [PI_SPI_OPEN_FAILED]: "can't open SPI device",
        [PI_BAD_I2C_BUS]: 'bad I2C bus',
        [PI_BAD_I2C_ADDR]: 'bad I2C address',
        [PI_BAD_SPI_CHANNEL]: 'bad SPI channel',
        [PI_BAD_FLAGS]: 'bad i2c/spi/ser open flags',
        [PI_BAD_SPI_SPEED]: 'bad SPI speed',
        [PI_BAD_SER_DEVICE]: 'bad serial device name',
        [PI_BAD_SER_SPEED]: 'bad serial baud rate',
        [PI_BAD_PARAM]: 'bad i2c/spi/ser parameter',
        [PI_I2C_WRITE_FAILED]: 'I2C write failed',
        [PI_I2C_READ_FAILED]: 'I2C read failed',
        [PI_BAD_SPI_COUNT]: 'bad SPI count',
        [PI_SER_WRITE_FAILED]: 'ser write failed',
        [PI_SER_READ_FAILED]: 'ser read failed',
        [PI_SER_READ_NO_DATA]: 'ser read no data available',
        [PI_UNKNOWN_COMMAND]: 'unknown command',
        [PI_SPI_XFER_FAILED]: 'spi xfer/read/write failed',
        [_PI_BAD_POINTER]: 'bad (NULL) pointer',
        [PI_NO_AUX_SPI]: 'no auxiliary SPI on Pi A or B',
        [PI_NOT_PWM_GPIO]: 'GPIO is not in use for PWM',
        [PI_NOT_SERVO_GPIO]: 'GPIO is not in use for servo pulses',
        [PI_NOT_HCLK_GPIO]: 'GPIO has no hardware clock',
        [PI_NOT_HPWM_GPIO]: 'GPIO has no hardware PWM',
        [PI_BAD_HPWM_FREQ]: 'invalid hardware PWM frequency',
        [PI_BAD_HPWM_DUTY]: 'hardware PWM dutycycle not 0-1M',
        [PI_BAD_HCLK_FREQ]: 'invalid hardware clock frequency',
        [PI_BAD_HCLK_PASS]: 'need password to use hardware clock 1',
        [PI_HPWM_ILLEGAL]: 'illegal, PWM in use for main clock',
        [PI_BAD_DATABITS]: 'serial data bits not 1-32',
        [PI_BAD_STOPBITS]: 'serial (half) stop bits not 2-8',
        [PI_MSG_TOOBIG]: 'socket/pipe message too big',
        [PI_BAD_MALLOC_MODE]: 'bad memory allocation mode',
        [_PI_TOO_MANY_SEGS]: 'too many I2C transaction segments',
        [_PI_BAD_I2C_SEG]: 'an I2C transaction segment failed',
        [PI_BAD_SMBUS_CMD]: 'SMBus command not supported by driver',
        [PI_NOT_I2C_GPIO]: 'no bit bang I2C in progress on GPIO',
        [PI_BAD_I2C_WLEN]: 'bad I2C write length',
        [PI_BAD_I2C_RLEN]: 'bad I2C read length',
        [PI_BAD_I2C_CMD]: 'bad I2C command',
        [PI_BAD_I2C_BAUD]: 'bad I2C baud rate, not 50-500k',
        [PI_CHAIN_LOOP_CNT]: 'bad chain loop count',
        [PI_BAD_CHAIN_LOOP]: 'empty chain loop',
        [PI_CHAIN_COUNTER]: 'too many chain counters',
        [PI_BAD_CHAIN_CMD]: 'bad chain command',
        [PI_BAD_CHAIN_DELAY]: 'bad chain delay micros',
        [PI_CHAIN_NESTING]: 'chain counters nested too deeply',
        [PI_CHAIN_TOO_BIG]: 'chain is too long',
        [PI_DEPRECATED]: 'deprecated function removed',
        [PI_BAD_SER_INVERT]: 'bit bang serial invert not 0 or 1',
        [_PI_BAD_EDGE]: 'bad ISR edge, not 1, 1, or 2',
        [_PI_BAD_ISR_INIT]: 'bad ISR initialisation',
        [PI_BAD_FOREVER]: 'loop forever must be last chain command',
        [PI_BAD_FILTER]: 'bad filter parameter',
        [PI_BAD_PAD]: 'bad pad number',
        [PI_BAD_STRENGTH]: 'bad pad drive strength',
        [PI_FIL_OPEN_FAILED]: 'file open failed',
        [PI_BAD_FILE_MODE]: 'bad file mode',
        [PI_BAD_FILE_FLAG]: 'bad file flag',
        [PI_BAD_FILE_READ]: 'bad file read',
        [PI_BAD_FILE_WRITE]: 'bad file write',
        [PI_FILE_NOT_ROPEN]: 'file not open for read',
        [PI_FILE_NOT_WOPEN]: 'file not open for write',
        [PI_BAD_FILE_SEEK]: 'bad file seek',
        [PI_NO_FILE_MATCH]: 'no files match pattern',
        [PI_NO_FILE_ACCESS]: 'no permission to access file',
        [PI_FILE_IS_A_DIR]: 'file is a directory',
        [PI_BAD_SHELL_STATUS]: 'bad shell return status',
        [PI_BAD_SCRIPT_NAME]: 'bad script name',
        [PI_BAD_SPI_BAUD]: 'bad SPI baud rate, not 50-500k',
        [PI_NOT_SPI_GPIO]: 'no bit bang SPI in progress on GPIO',
        [PI_BAD_EVENT_ID]: 'bad event id',
        [PI_CMD_INTERRUPTED]: 'command interrupted, Python',
        [PI_NOT_ON_BCM2711]: 'not available on BCM2711',
        [PI_ONLY_ON_BCM2711]: 'only available on BCM2711'
    }
    return errorMessages[errnum] ?? `unknown error (${errnum}))`
}

/**
 * Returns the microsecond difference between two ticks.
 * @param t1 - the earlier tick
 * @param t2 - the later tick
 * ```ts
 * console.log(tickDiff(4294967272, 12)) // 36
 * ```
 */
export function tickDiff (t1: number, t2: number): number {
    let tDiff = t2 - t1
    if (tDiff < 0) {
        tDiff += 2 ** 32
    }
    return tDiff
}

/** This is low level interface.
 * It is the same feature as the original python library except that all requests are asynchronous.
 * http://abyz.me.uk/rpi/pigpio/python.html
 *  */
export async function pi (host?: string, port?: number): Promise<pigpio> {
    const hostname = host || process.env.PIGPIO_ADDR || 'localhost'
    const portnumber = port || Number(process.env.PIGPIO_PORT) || 8888

    const reqSocket = await createRequestSocket(portnumber, hostname)
    const notifySocket = await createNotifySocket(portnumber, hostname, reqSocket)

    const reqParam = createRequestParam
    const pigpioCommand = async (request: RequestParam): Promise<number> => {
        const res = (await reqSocket.request(request)).res
        if (res < 0 && exceptions) {
            throw Error(error_text(res))
        }
        return res
    }
    const pigpioCommandExt = async (request: RequestParam): Promise<[number, Buffer]> => {
        const r = await reqSocket.request(request)
        if (r.res < 0 && exceptions) {
            throw Error(error_text(r.res))
        }
        return [r.res, r.extension ?? Buffer.of()]
    }
    class PiImpl implements pigpio {
        async stop (): Promise<void> {
            await notifySocket.close()
            await reqSocket.close()
        }

        set_mode (gpio: number, mode: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'MODES', gpio, mode }))
        }

        get_mode (gpio: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'MODEG', gpio }))
        }

        set_pull_up_down (gpio: number, pud: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'PUD', gpio, pud }))
        }

        read (gpio: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'READ', gpio }))
        }

        write (gpio: number, level: Level): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WRITE', gpio, level }))
        }

        set_PWM_dutycycle (user_gpio: number, dutycycle: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'PWM', gpio: user_gpio, dutycycle })
            )
        }

        set_PWM_frequency (user_gpio: number, frequency: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'PFS', gpio: user_gpio, frequency })
            )
        }

        set_PWM_range (user_gpio: number, range: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'PRS', gpio: user_gpio, range })
            )
        }

        get_PWM_dutycycle (user_gpio: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'GDC', gpio: user_gpio })
            )
        }

        get_PWM_frequency (user_gpio: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'PFG', gpio: user_gpio })
            )
        }

        get_PWM_range (user_gpio: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'PRG', gpio: user_gpio })
            )
        }

        get_PWM_real_range (user_gpio: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'PRRG', gpio: user_gpio })
            )
        }

        set_servo_pulsewidth (
            user_gpio: number,
            pulsewidth: number
        ): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'SERVO', gpio: user_gpio, pulsewidth })
            )
        }

        get_servo_pulsewidth (user_gpio: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'GPW', gpio: user_gpio })
            )
        }

        gpio_trigger (
            user_gpio: number,
            pulse_len: number,
            level: Level
        ): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(level)
            return pigpioCommand(
                reqParam({ command: 'TRIG', gpio: user_gpio, pulselen: pulse_len, extension })
            )
        }

        set_watchdog (
            user_gpio: number,
            wdog_timeout: number
        ): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'WDOG', gpio: user_gpio, timeout: wdog_timeout })
            )
        }

        read_bank_1 (): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'BR1' })
            )
        }

        read_bank_2 (): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'BR2' })
            )
        }

        clear_bank_1 (bits: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'BC1', bits })
            )
        }

        clear_bank_2 (bits: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'BC2', bits })
            )
        }

        set_bank_1 (bits: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'BS1', bits })
            )
        }

        set_bank_2 (bits: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'BS2', bits })
            )
        }

        callback (
            user_gpio: number,
            edge: EdgeType,
            func?: (gpio: number, level: 0|1|'TIMEOUT', tick: number) => void
        ): Callback {
            let count = 0
            const f = func ?? (() => { count += 1 })

            const ev = {
                gpio: user_gpio,
                edge,
                bit: 1 << user_gpio,
                func: f
            }
            notifySocket.append(ev)

            const e: Event = {
                cancel: () => {
                    notifySocket.remove(ev)
                },
                tally: () => {
                    return count
                },
                reset_tally: () => {
                    count = 0
                }
            }
            return e
        }

        wait_for_edge (
            user_gpio: number,
            edge: EdgeType,
            wait_timeout: number
        ): Promise<boolean> {
            return new Promise<boolean>((resolve) => {
                const e = this.callback(user_gpio, edge, () => {
                    resolve(true)
                    e.cancel()
                })
                setTimeout(() => {
                    resolve(false)
                    e.cancel()
                }, wait_timeout * 1000)
            })
        }

        notify_open (): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'NO' })
            )
        }

        notify_begin (handle: number, bits: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'NB', handle, bits })
            )
        }

        notify_pause (handle: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'NB', handle, bits: 0 })
            )
        }

        notify_close (handle: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'NC', handle })
            )
        }

        hardware_clock (gpio: number, clkfreq: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'HC', gpio, frequency: clkfreq })
            )
        }

        hardware_PWM (
            gpio: number,
            PWMfreq: number,
            PWMduty: number
        ): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(PWMduty)
            return pigpioCommand(
                reqParam({ command: 'HP', gpio, frequency: PWMfreq, extension })
            )
        }

        set_glitch_filter (user_gpio: number, steady: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'FG', gpio: user_gpio, steady })
            )
        }

        set_noise_filter (
            user_gpio: number,
            steady: number,
            active: number
        ): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(active)
            return pigpioCommand(
                reqParam({ command: 'FN', gpio: user_gpio, steady, extension })
            )
        }

        set_pad_strength (pad: number, pad_strength: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'PADS', pad, strength: pad_strength })
            )
        }

        get_pad_strength (pad: number): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'PADG', pad })
            )
        }

        shell (shellscr: string, pstring: string): Promise<number> {
            const extension = Buffer.from(shellscr + '\0' + pstring, 'utf-8')
            return pigpioCommand(
                reqParam({ command: 'SHELL', 'len(name)': shellscr.length, extension })
            )
        }

        custom_1 (
            arg1 = 0,
            arg2 = 0,
            argx = Buffer.of()
        ): Promise<number> {
            return pigpioCommand(
                reqParam({ command: 'CF1', arg1, arg2, extension: argx })
            )
        }

        custom_2 (
            arg1 = 0,
            argx = Buffer.of(),
            retMax = 0
        ): Promise<[number, Buffer]> {
            return pigpioCommandExt(
                reqParam({ command: 'CF2', arg1, retMax, extension: argx })
            )
        }

        event_callback (
            event: number,
            func?: (event: number, tick: number) => void
        ): Event {
            let count = 0
            const f = func ?? (() => { count += 1 })

            const ev = {
                event,
                bit: 1 << event,
                func: f
            }
            notifySocket.appendEvent(ev)

            const e: Event = {
                cancel: () => {
                    notifySocket.removeEvent(ev)
                },
                tally: () => {
                    return count
                },
                reset_tally: () => {
                    count = 0
                }
            }
            return e
        }

        event_trigger (event: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'EVT', event }))
        }

        wait_for_event (event: number, wait_timeout: number): Promise<boolean> {
            return new Promise<boolean>((resolve) => {
                const e = this.event_callback(event, () => {
                    resolve(true)
                    e.cancel()
                })
                setTimeout(() => {
                    resolve(false)
                    e.cancel()
                }, wait_timeout * 1000)
            })
        }

        store_script (script: string): Promise<number> {
            return pigpioCommand(reqParam({ command: 'PROC', extension: Buffer.from(script, 'utf-8') }))
        }

        run_script (script_id: number, params: number[]): Promise<number> {
            const extension = Buffer.alloc(params.length * 4)
            params.forEach((p, index) => {
                extension.writeUInt32LE(p, index * 4)
            })
            return pigpioCommand(reqParam({ command: 'PROCR', script_id, extension }))
        }

        update_script (script_id: number, params: number[]): Promise<number> {
            const extension = Buffer.alloc(params.length * 4)
            params.forEach((p, index) => {
                extension.writeUInt32LE(p, index * 4)
            })
            return pigpioCommand(reqParam({ command: 'PROCU', script_id, extension }))
        }

        async script_status (script_id: number): Promise<[ScriptStatusType, number[]]> {
            const [res, d] = await pigpioCommandExt(reqParam({ command: 'PROCP', script_id }))

            if (res === 0) {
                return [0, []]
            }
            const status = d.readInt32LE() as ScriptStatusType
            const params: number[] = []
            let offset = 4
            while (offset + 4 < d.length) {
                params.push(d.readInt32LE(offset))
                offset += 4
            }
            return [status, params]
        }

        stop_script (script_id: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'PROCS', script_id }))
        }

        delete_script (script_id: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'PROCD', script_id }))
        }

        i2c_open (
            i2c_bus: number,
            i2c_address: number,
            i2c_flags = 0
        ): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(i2c_flags)
            return pigpioCommand(reqParam({ command: 'I2CO', bus: i2c_bus, device: i2c_address, extension }))
        }

        i2c_close (handle: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'I2CC', handle }))
        }

        i2c_write_quick (handle: number, bit: Level): Promise<number> {
            return pigpioCommand(reqParam({ command: 'I2CWQ', handle, bit }))
        }

        i2c_read_byte (handle: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'I2CRS', handle }))
        }

        i2c_write_byte (handle: number, byte_val: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'I2CWS', handle, byte: byte_val }))
        }

        i2c_read_byte_data (handle: number, reg: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'I2CRB', handle, register: reg }))
        }

        i2c_write_byte_data (
            handle: number,
            reg: number,
            byte_val: number
        ): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(byte_val)
            return pigpioCommand(reqParam({ command: 'I2CWB', handle, register: reg, extension }))
        }

        i2c_read_word_data (handle: number, reg: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'I2CRW', handle, register: reg }))
        }

        i2c_write_word_data (
            handle: number,
            reg: number,
            word_val: number
        ): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(word_val)
            return pigpioCommand(reqParam({ command: 'I2CWW', handle, register: reg, extension }))
        }

        i2c_read_block_data (
            handle: number,
            reg: number
        ): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'I2CRK', handle, register: reg }))
        }

        i2c_write_block_data (
            handle: number,
            reg: number,
            data: Buffer
        ): Promise<number> {
            return pigpioCommand(reqParam({ command: 'I2CWK', handle, register: reg, extension: data }))
        }

        i2c_read_i2c_block_data (
            handle: number,
            reg: number,
            count: number
        ): Promise<[number, Buffer]> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(count)
            return pigpioCommandExt(reqParam({ command: 'I2CRI', handle, register: reg, extension }))
        }

        i2c_write_i2c_block_data (
            handle: number,
            reg: number,
            data: Buffer
        ): Promise<number> {
            return pigpioCommand(reqParam({ command: 'I2CWI', handle, register: reg, extension: data }))
        }

        i2c_read_device (
            handle: number,
            count: number
        ): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'I2CRD', handle, count }))
        }

        i2c_write_device (handle: number, data: Buffer): Promise<number> {
            return pigpioCommand(reqParam({ command: 'I2CWD', handle, extension: data }))
        }

        i2c_process_call (
            handle: number,
            reg: number,
            word_val: number
        ): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(word_val)
            return pigpioCommand(reqParam({ command: 'I2CPC', handle, register: reg, extension }))
        }

        i2c_block_process_call (
            handle: number,
            reg: number,
            data: Buffer
        ): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'I2CPC', handle, register: reg, extension: data }))
        }

        i2c_zip (handle: number, data: Buffer): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'I2CZ', handle, extension: data }))
        }

        bb_i2c_open (SDA: number, SCL: number, baud: number): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(baud)
            return pigpioCommand(reqParam({ command: 'BI2CO', sda: SDA, scl: SCL, extension }))
        }

        bb_i2c_close (SDA: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'BI2CC', sda: SDA }))
        }

        bb_i2c_zip (SDA: number, data: Buffer): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'BI2CZ', sda: SDA, extension: data }))
        }

        async bsc_xfer (
            bsc_control: number,
            data: Buffer
        ): Promise<[number, number, Buffer]> {
            const [res, d] = await pigpioCommandExt(reqParam({ command: 'BSCX', control: bsc_control, extension: data }))

            if (res === 0) {
                return [0, 0, d]
            }
            const status = d.readInt32LE()
            return [status, res - 4, d]
        }

        bsc_i2c (
            i2c_address: number,
            data: Buffer
        ): Promise<[number, number, Buffer]> {
            const control = i2c_address ? (i2c_address << 16) | 0x305 : 0
            return this.bsc_xfer(control, data)
        }

        serial_open (
            tty: string,
            baud: number,
            ser_flags = 0
        ): Promise<number> {
            return pigpioCommand(reqParam({ command: 'SERO', baud, flags: ser_flags, extension: Buffer.from(tty, 'utf-8') }))
        }

        serial_close (handle: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'SERC', handle }))
        }

        serial_read_byte (handle: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'SERRB', handle }))
        }

        serial_write_byte (handle: number, byte_val: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'SERWB', handle, byte: byte_val }))
        }

        serial_read (
            handle: number,
            count: number
        ): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'SERR', handle, count }))
        }

        serial_write (handle: number, data: Buffer): Promise<number> {
            return pigpioCommand(reqParam({ command: 'SERW', handle, extension: data }))
        }

        serial_data_available (handle: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'SERDA', handle }))
        }

        bb_serial_read_open (
            user_gpio: number,
            baud: number,
            bb_bits: number
        ): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(bb_bits)
            return pigpioCommand(reqParam({ command: 'SLRO', gpio: user_gpio, baud, extension }))
        }

        bb_serial_read_close (user_gpio: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'SLRC', gpio: user_gpio }))
        }

        bb_serial_invert (user_gpio: number, invert: 0 | 1): Promise<number> {
            return pigpioCommand(reqParam({ command: 'SLRI', gpio: user_gpio, invert }))
        }

        bb_serial_read (user_gpio: number): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'SLR', gpio: user_gpio, count: 10000 }))
        }

        spi_open (
            spi_channel: number,
            baud: number,
            spi_flags = 0
        ): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(spi_flags)
            return pigpioCommand(reqParam({ command: 'SPIO', channel: spi_channel, baud, extension }))
        }

        spi_close (handle: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'SPIC', handle }))
        }

        spi_read (handle: number, count: number): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'SPIR', handle, count }))
        }

        spi_write (handle: number, data: Buffer): Promise<number> {
            return pigpioCommand(reqParam({ command: 'SPIW', handle, extension: data }))
        }

        spi_xfer (
            handle: number,
            data: Buffer
        ): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'SPIX', handle, extension: data }))
        }

        bb_spi_open (
            CS: number,
            MISO: number,
            MOSI: number,
            SCLK: number,
            baud: number,
            spiFlags = 0
        ): Promise<number> {
            const extension = Buffer.alloc(20)
            extension.writeUInt32LE(MISO, 0)
            extension.writeUInt32LE(MOSI, 4)
            extension.writeUInt32LE(SCLK, 8)
            extension.writeUInt32LE(baud, 12)
            extension.writeUInt32LE(spiFlags, 16)
            return pigpioCommand(reqParam({ command: 'BSPIO', CS, extension }))
        }

        bb_spi_close (CS: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'BSPIC', CS }))
        }

        bb_spi_xfer (CS: number, data: Buffer): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'BSPIX', CS, extension: data }))
        }

        file_open (file_name: string, file_mode: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'FO', mode: file_mode, extension: Buffer.from(file_name, 'utf-8') }))
        }

        file_close (handle: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'FC', handle }))
        }

        file_read (handle: number, count: number): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'FR', handle, count }))
        }

        file_write (handle: number, data: Buffer): Promise<number> {
            return pigpioCommand(reqParam({ command: 'FW', handle, extension: data }))
        }

        file_seek (
            handle: number,
            seek_offset: number,
            seek_from: number
        ): Promise<number> {
            const extension = Buffer.alloc(4)
            extension.writeUInt32LE(seek_from)
            return pigpioCommand(reqParam({ command: 'FS', handle, offset: seek_offset, extension }))
        }

        file_list (file_name: string): Promise<[number, Buffer]> {
            return pigpioCommandExt(reqParam({ command: 'FL', count: 60000, extension: Buffer.from(file_name, 'utf-8') }))
        }

        wave_clear (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVCLR' }))
        }

        wave_add_new (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVNEW' }))
        }

        wave_add_generic (pulses: Pulse[]): Promise<number> {
            const extension = Buffer.alloc(pulses.length * 12)
            pulses.forEach((p, index) => {
                extension.writeUInt32LE(p.gpio_on, index * 12)
                extension.writeUInt32LE(p.gpio_off, index * 12 + 4)
                extension.writeUInt32LE(p.delay, index * 12 + 8)
            })
            return pigpioCommand(reqParam({ command: 'WVAG', extension }))
        }

        wave_add_serial (
            user_gpio: number,
            baud: number,
            data: Buffer,
            offset = 0,
            bb_bits = 8,
            bb_stop = 2
        ): Promise<number> {
            const extension = Buffer.alloc(data.length + 12)
            extension.writeUInt32LE(bb_bits, 0)
            extension.writeUInt32LE(bb_stop, 4)
            extension.writeUInt32LE(offset, 8)
            extension.set(data, 12)

            return pigpioCommand(reqParam({ command: 'WVAS', gpio: user_gpio, baud, extension }))
        }

        wave_create (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVCRE' }))
        }

        wave_create_and_pad (percent: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVCAP', percent }))
        }

        wave_delete (wave_id: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVDEL', wave_id }))
        }

        wave_send_once (wave_id: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVTX', wave_id }))
        }

        wave_send_repeat (wave_id: number): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVTXR', wave_id }))
        }

        wave_send_using_mode (wave_id: number, mode: WaveModeType): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVTXM', wave_id, mode }))
        }

        wave_chain (data: Buffer): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVCHA', extension: data }))
        }

        wave_tx_at (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVTAT' }))
        }

        wave_tx_busy (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVBSY' }))
        }

        wave_tx_stop (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVHLT' }))
        }

        wave_get_cbs (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVSC', subcmd: 0 }))
        }

        wave_get_max_cbs (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVSC', subcmd: 2 }))
        }

        wave_get_micros (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVSM', subcmd: 0 }))
        }

        wave_get_max_micros (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVSM', subcmd: 2 }))
        }

        wave_get_pulses (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVSP', subcmd: 0 }))
        }

        wave_get_max_pulses (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'WVSP', subcmd: 2 }))
        }

        get_current_tick (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'TICK' }))
        }

        get_hardware_revision (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'HWVER' }))
        }

        get_pigpio_version (): Promise<number> {
            return pigpioCommand(reqParam({ command: 'PIGPV' }))
        }

        get connected (): boolean {
            return reqSocket.connected
        }
    }
    return new PiImpl()
}

export default pigpio
