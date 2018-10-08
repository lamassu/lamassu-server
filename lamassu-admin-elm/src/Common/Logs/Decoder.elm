module Common.Logs.Decoder exposing (..)

import Json.Decode exposing (..)
import Json.Decode.Extra exposing (date, fromResult)
import Json.Decode.Pipeline exposing (decode, required, optional, hardcoded)
import Common.Logs.Types exposing (..)


logsDecoder : Decoder Logs
logsDecoder =
    decode Logs
        |> required "logs" (list logDecoder)
        |> required "currentMachine" machineDecoder


logDecoder : Decoder Log
logDecoder =
    decode Log
        |> required "id" string
        |> required "timestamp" date
        |> required "logLevel" string
        |> required "message" string


supportLogsDecoder : Decoder SupportLogs
supportLogsDecoder =
    field "supportLogs" (list supportLogDecoder)


latestLogSnapshotDecoder : Decoder SupportLogSnapshot
latestLogSnapshotDecoder =
    decode SupportLogSnapshot
        |> required "deviceId" string
        |> required "timestamp" date


supportLogDecoder : Decoder SupportLog
supportLogDecoder =
    decode SupportLog
        |> required "id" string
        |> required "deviceId" string
        |> required "timestamp" date
        |> required "name" string


machinesDecoder : Decoder Machines
machinesDecoder =
    field "machines" (list machineDecoder)


machineDecoder : Decoder Machine
machineDecoder =
    decode Machine
        |> required "deviceId" string
        |> required "name" string
