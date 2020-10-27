/* eslint-disable no-bitwise */
import { I2cZipCommand } from '../../types'

export enum ZipCommand {
    End = 0,
    Escape = 1,
    Start = 2,
    On = 2,
    Stop = 3,
    Off = 3,
    Address = 4,
    Flags = 5,
    Read = 6,
    Write = 7,
}

export const buildZipCommand = (command: I2cZipCommand, bb: boolean): Buffer => {
    const P = (v: number): number[] => {
        if (v > 65535) {
            // TODO split data?
            throw new Error('Data size require 0-65535')
        } else if (v > 255) {
            return [v & 0xff, v >> 8]
        }
        return [v]
    }

    switch (command.type) {
        case 'Read': {
            const data: number[] = []
            if (bb) {
                data.push(ZipCommand.Start)
            }
            const p = P(command.size)
            if (p.length > 1) {
                data.push(ZipCommand.Escape)
            }
            data.push(ZipCommand.Read)
            data.push(...p)
            return Buffer.of(...data)
        }
        case 'Write': {
            const data: number[] = []
            if (bb) {
                data.push(ZipCommand.Start)
            }
            const p = P(command.data.length)
            if (p.length > 1) {
                data.push(ZipCommand.Escape)
            }
            data.push(ZipCommand.Write)
            data.push(...p)
            return Buffer.concat([Buffer.of(...data), command.data])
        }
        default:
            throw Error('Unknown commmand')
    }
}

export default { buildZipCommand }
