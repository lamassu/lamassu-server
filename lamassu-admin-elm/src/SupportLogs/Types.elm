module SupportLogs.Types exposing (..)

import RemoteData exposing (..)
import Common.Logs.Types exposing (..)


type alias Model =
    { logs : WebData Logs
    , supportLogs : WebData SupportLogs
    }


type Msg
    = LoadLogs (WebData Logs)
    | LoadSupportLogs (WebData SupportLogs)
