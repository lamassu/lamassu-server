module Logs.Types exposing (..)

import RemoteData exposing (..)
import Common.Logs.Types exposing (..)


type alias Model =
    { logs : WebData Logs
    , machines : WebData Machines
    , latestLogSnapshot : WebData SupportLogSnapshot
    }


type Msg
    = LoadLogs (WebData Logs)
    | LoadMachines (WebData Machines)
    | ShareLogs Machine
    | LoadSupportLog (WebData SupportLogSnapshot)
