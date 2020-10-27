import RequestCommandsOnPage from './RequestCommands'
import ResponseCommandsOnPage from './ResponseCommands'

import { RequestParam } from '../RequestSocket'

// Currently not available in http://abyz.me.uk/rpi/pigpio/sif.html
const RequestCommands = {
    WVCAP: {
        cmdNo: 118,
        p1: 'percent',
        p2: '0',
        p3: '0',
        extension: [
            '-'
        ]
    },
    ...RequestCommandsOnPage
} as const
const ResponseCommands = {
    WVCAP: {
        cmdNo: 118,
        p1: 'percent',
        p2: '0',
        p3: '0',
        extension: [
            '-'
        ]
    },
    ...ResponseCommandsOnPage
} as const

export type Equals<T, S> = [T] extends [S]
    ? [S] extends [T]
        ? true
        : false
    : false;

type RequestCommandType = typeof RequestCommands;
type RequestTypeNames = keyof RequestCommandType;

type HasExtensionRequest<
    T extends RequestTypeNames,
    TrueType,
    FalseType,
> = RequestCommandType[T]['extension'][0] extends '-' | 'N/A'
    ? FalseType
    : TrueType;

type ParamType<T> = T extends '0' ? never : T;
type P1name<T extends RequestTypeNames> = ParamType<
RequestCommandType[T]['p1']
>;
type P2name<T extends RequestTypeNames> = ParamType<
RequestCommandType[T]['p2']
>;

type ExtensionRequestCommandP1<T extends RequestTypeNames> = {
    [P in P1name<T>]: number;
}
type ExtensionRequestCommandP2<T extends RequestTypeNames> = {
    [P in P2name<T>]: number;
}
type ExtensionRequestCommand<T extends RequestTypeNames> = {
    command: T;
} & ExtensionRequestCommandP1<T> & ExtensionRequestCommandP2<T>

type RequestCommand<T extends RequestTypeNames> = HasExtensionRequest<
T,
ExtensionRequestCommand<T> & {
    extension: Buffer;
},
ExtensionRequestCommand<T>
>;

const isExtensionRequest = <T extends RequestTypeNames>(
    param: RequestCommand<T>
): param is RequestCommand<T> & { extension: Buffer } => (param as { extension: Buffer }).extension?.length > 0

const pickParam = <T>(
    param: T,
    name: string
): number => {
    const v = param[name as keyof T]
    if (typeof v === 'number') {
        return v
    }
    return 0
}

export const createRequestParam = <T extends RequestTypeNames>(
    param: RequestCommand<T>
): RequestParam => {
    const p1name = RequestCommands[param.command].p1

    const p1 = pickParam(param, p1name) | 0
    const p2name = RequestCommands[param.command].p2
    const p2 = pickParam(param, p2name) | 0
    const cmd = RequestCommands[param.command].cmdNo
    const extension = isExtensionRequest(param) ? param.extension : undefined

    const responseExtensionName = ResponseCommands[param.command].extension
    const responseExtension = responseExtensionName[0] !== '-' && responseExtensionName[0] !== 'N/A'
    return {
        cmd, p1, p2, extension, responseExtension
    }
}
