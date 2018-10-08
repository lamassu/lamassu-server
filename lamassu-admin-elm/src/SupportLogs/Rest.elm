module SupportLogs.Rest exposing (..)

import RemoteData exposing (..)
import Http
import Common.Logs.Decoder exposing (logsDecoder, supportLogDecoder, supportLogsDecoder)
import SupportLogs.Types exposing (..)


getAllLogs : Maybe String -> Cmd Msg
getAllLogs maybeId =
    Http.get ("/api/support_logs/logs?supportLogId=" ++ (Maybe.withDefault "" maybeId)) logsDecoder
        |> RemoteData.sendRequest
        |> Cmd.map LoadLogs


getSupportLogs : Cmd Msg
getSupportLogs =
    Http.get "/api/support_logs/" supportLogsDecoder
        |> RemoteData.sendRequest
        |> Cmd.map LoadSupportLogs
