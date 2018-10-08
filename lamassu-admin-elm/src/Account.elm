module Account exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Keyed
import RemoteData exposing (..)
import Http
import HttpBuilder exposing (..)
import AccountTypes exposing (..)
import AccountDecoder exposing (..)
import AccountEncoder exposing (..)
import FieldSet.Types
import FieldSet.State
import FieldSet.View
import Css.Admin exposing (..)
import Css.Classes
import Process
import Time exposing (second)
import Task


type alias SubModel =
    { status : SavingStatus
    , account : Account
    }


type alias Model =
    RemoteData.WebData SubModel


type SavingStatus
    = Saving
    | Saved
    | Editing
    | NotSaving


toModel : SavingStatus -> Account -> SubModel
toModel status account =
    { status = status, account = account }


getForm : String -> Cmd Msg
getForm code =
    get ("/api/account/" ++ code)
        |> withExpect (Http.expectJson accountDecoder)
        |> send (Result.map (toModel NotSaving) >> RemoteData.fromResult)
        |> Cmd.map Load


postForm : Account -> Cmd Msg
postForm account =
    post "/api/account"
        |> withJsonBody (encodeAccount account)
        |> withExpect (Http.expectJson accountDecoder)
        |> send (Result.map (toModel Saved) >> RemoteData.fromResult)
        |> Cmd.map Load


init : Model
init =
    RemoteData.NotAsked


load : String -> ( Model, Cmd Msg )
load code =
    ( RemoteData.Loading, getForm code )



-- UPDATE


type Msg
    = Load Model
    | Submit
    | FieldSetMsg FieldSet.Types.Msg
    | HideSaveIndication


saveUpdate : SubModel -> ( SubModel, Cmd Msg )
saveUpdate model =
    let
        cmd =
            if (model.status == Saved) then
                Process.sleep (2 * second)
                    |> Task.perform (\_ -> HideSaveIndication)
            else
                Cmd.none
    in
        model ! [ cmd ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg webModel =
    case msg of
        Load newModel ->
            RemoteData.update saveUpdate newModel

        Submit ->
            RemoteData.update (\model -> model ! [ postForm model.account ]) webModel

        HideSaveIndication ->
            RemoteData.update (\model -> { model | status = NotSaving } ! []) webModel

        FieldSetMsg fieldSetMsg ->
            let
                updateFields model =
                    FieldSet.State.update fieldSetMsg model.account.fields

                newAccount account fields =
                    { account | fields = fields }

                toModel model fieldsUpdate =
                    { model
                        | account =
                            newAccount model.account
                                (Tuple.first fieldsUpdate)
                    }
                        ! [ Cmd.map FieldSetMsg (Tuple.second fieldsUpdate) ]

                mapper model =
                    updateFields model
                        |> (toModel model)
            in
                RemoteData.update mapper webModel


view : Model -> Html Msg
view webModel =
    case webModel of
        NotAsked ->
            div [] []

        Loading ->
            div [] [ text "Loading..." ]

        Failure err ->
            div [] [ text (toString err) ]

        Success model ->
            let
                fieldSetView =
                    Html.Keyed.node "div" [] [ ( model.account.code, (Html.map FieldSetMsg (FieldSet.View.view model.account.fields)) ) ]

                statusString =
                    case model.status of
                        Saved ->
                            "Saved"

                        _ ->
                            ""
            in
                div []
                    [ div [ class [ Css.Classes.SectionLabel ] ] [ text model.account.display ]
                    , form [ id model.account.code ]
                        [ fieldSetView
                        , div [ class [ Css.Classes.ButtonRow ] ]
                            [ div [ onClick Submit, class [ Css.Classes.Button ] ] [ text "Submit" ]
                            , div [] [ text statusString ]
                            ]
                        ]
                    ]
