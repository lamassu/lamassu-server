module SupportLogs.State exposing (..)

import RemoteData exposing (..)
import SupportLogs.Rest exposing (..)
import SupportLogs.Types exposing (..)


init : Model
init =
    { logs = NotAsked, supportLogs = NotAsked }


load : Maybe String -> ( Model, Cmd Msg )
load maybeId =
    ( { logs = Loading, supportLogs = Loading }, getSupportData maybeId )


getSupportData : Maybe String -> Cmd Msg
getSupportData maybeId =
    Cmd.batch [ getAllLogs maybeId, getSupportLogs ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        LoadLogs response ->
            ( { model | logs = response }
            , Cmd.none
            )

        LoadSupportLogs response ->
            ( { model | supportLogs = response }
            , Cmd.none
            )
