module Main exposing (..)

import Html exposing (Html, Attribute, a, div, hr, input, span, text, map)
import Html.Attributes exposing (class)
import Navigation
import SupportLogs.Types
import SupportLogs.State
import SupportLogs.View
import UrlParser exposing ((</>), s, string, top, parseHash)
import Navigation exposing (newUrl, Location)
import StatusTypes exposing (..)


type Category
    = AccountCat
    | MachineSettingsCat
    | GlobalSettingsCat
    | MaintenanceCat


type Route
    = SupportLogsRoute (Maybe String)
    | NotFoundRoute


type Msg
    = SupportLogsMsg SupportLogs.Types.Msg
    | UrlChange Navigation.Location


main : Program Never Model Msg
main =
    Navigation.program UrlChange
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }



-- URL PARSERS


parseRoute : UrlParser.Parser (Route -> a) a
parseRoute =
    UrlParser.oneOf
        [ UrlParser.map (\id -> SupportLogsRoute (Just id)) (s "support_logs" </> string)
        , UrlParser.map (SupportLogsRoute Nothing) (s "support_logs")
        ]



-- MODEL


type alias Model =
    { location : Location
    , supportLogs : SupportLogs.Types.Model
    , status : Maybe StatusRec
    , err : Maybe String
    }


init : Location -> ( Model, Cmd Msg )
init location =
    let
        model =
            { location = location
            , supportLogs = SupportLogs.State.init
            , status = Nothing
            , err = Nothing
            }

        ( newModel, newCmd ) =
            urlUpdate location model
    in
        newModel ! [ newCmd ]



-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        SupportLogsMsg supportLogsMsg ->
            let
                ( supportLogsModel, cmd ) =
                    SupportLogs.State.update supportLogsMsg model.supportLogs
            in
                { model | supportLogs = supportLogsModel } ! [ Cmd.map SupportLogsMsg cmd ]

        UrlChange location ->
            urlUpdate location model


content : Model -> Route -> Html Msg
content model route =
    case route of
        SupportLogsRoute _ ->
            map SupportLogsMsg (SupportLogs.View.view model.supportLogs)

        NotFoundRoute ->
            div [] [ text ("No such route") ]


view : Model -> Html Msg
view model =
    let
        route =
            Maybe.withDefault NotFoundRoute (parseHash parseRoute model.location)

        invalidConfigGroups =
            Maybe.map .invalidConfigGroups model.status
                |> Maybe.withDefault []
    in
        div [ class "lamassuAdminLayout" ]
            [ div
                [ class "lamassuAdminMain" ]
                [ div [ class "lamassuAdminContent" ]
                    [ content model route ]
                ]
            ]


urlUpdate : Location -> Model -> ( Model, Cmd Msg )
urlUpdate location model =
    let
        route =
            Maybe.withDefault NotFoundRoute (parseHash parseRoute location)
    in
        case route of
            SupportLogsRoute maybeId ->
                let
                    ( supportLogsModel, cmd ) =
                        SupportLogs.State.load maybeId
                in
                    { model | location = location, supportLogs = supportLogsModel } ! [ Cmd.map SupportLogsMsg cmd ]

            NotFoundRoute ->
                { model | location = location } ! []



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        []
