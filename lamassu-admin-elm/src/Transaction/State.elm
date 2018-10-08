module Transaction.State exposing (..)

import RemoteData exposing (..)
import Transaction.Types exposing (..)
import Transaction.Rest exposing (..)
import BasicTypes exposing (..)


init : Model
init =
    NotAsked


load : String -> ( Model, Cmd Msg )
load txId =
    ( Loading, getForm txId )


txUpdate : SubModel -> ( SubModel, Cmd Msg )
txUpdate model =
    model ! []


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Load newModel ->
            RemoteData.update txUpdate newModel

        Cancel txId ->
            model ! [ cancel txId ]

        HideSaveIndication ->
            RemoteData.update (\subModel -> { subModel | status = NotSaving } ! []) model
