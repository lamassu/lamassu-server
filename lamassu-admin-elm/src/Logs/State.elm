module Logs.State exposing (..)

import RemoteData exposing (..)
import Logs.Rest exposing (..)
import Logs.Types exposing (..)


init : Model
init =
    { logs = NotAsked, machines = NotAsked, latestLogSnapshot = NotAsked }


load : Maybe String -> ( Model, Cmd Msg )
load maybeId =
    ( { logs = Loading, machines = Loading, latestLogSnapshot = NotAsked }, getData maybeId )


getData : Maybe String -> Cmd Msg
getData maybeId =
    Cmd.batch [ getLogs maybeId, getMachines ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        LoadLogs response ->
            ( { model | logs = response }
            , Cmd.none
            )

        LoadMachines response ->
            ( { model | machines = response }
            , Cmd.none
            )

        ShareLogs machine ->
            model ! [ shareLogs machine.deviceId ]

        LoadSupportLog supportLog ->
            ( { model | latestLogSnapshot = supportLog }
            , Cmd.none
            )
