module Logs.View exposing (..)

import Html exposing (..)
import Html.Attributes exposing (href)
import Html.Events exposing (onClick)
import Css.Admin exposing (..)
import Css.Classes as C
import RemoteData exposing (..)
import List
import Common.Logs.Types exposing (..)
import Logs.Types exposing (..)
import Date exposing (..)
import Date.Extra exposing (toFormattedString)


machineLink : Machine -> Html Msg
machineLink machine =
    a [ href ("/#logs/" ++ machine.deviceId) ] [ text machine.name ]


logsActions : Logs -> Html Msg
logsActions logs =
    button [ onClick (ShareLogs logs.currentMachine) ] [ text "Share log snapshot" ]


formatDate : Date -> String
formatDate date =
    toFormattedString "yyyy-MM-dd HH:mm" date


rowView : Log -> Html Msg
rowView log =
    tr [ class [] ]
        [ td [] [ text (formatDate log.timestamp) ]
        , td [] [ text log.logLevel ]
        , td [] [ text log.message ]
        ]


machineRowView : Machine -> Html Msg
machineRowView machine =
    tr [ class [] ]
        [ td [] [ machineLink machine ]
        ]


machineItemView : Machine -> Html Msg
machineItemView machine =
    li [] [ machineLink machine ]


machinesView : Machines -> Html Msg
machinesView machines =
    if List.isEmpty machines then
        div [ class [ C.EmptyTable ] ] [ text "No paired machines." ]
    else
        div []
            [ div [ class [ C.TxTable ] ]
                [ ul [] (List.map machineItemView machines)
                ]
            ]


machines : Model -> Html Msg
machines model =
    case model.machines of
        NotAsked ->
            div [] []

        Loading ->
            div [] [ text "Loading machines ..." ]

        Failure err ->
            div [] [ text (toString err) ]

        Success machines ->
            div [] [ machinesView machines ]


latestLogSnapshot : Model -> Html Msg
latestLogSnapshot model =
    case model.latestLogSnapshot of
        NotAsked ->
            div [] []

        Loading ->
            div [] []

        Failure err ->
            div [] [ text (toString err) ]

        Success latestLogSnapshot ->
            h4 [] [ text "✓ Saved latest snapshot" ]


logsView : Logs -> Html Msg
logsView logs =
    if List.isEmpty logs.logs then
        div [] [ text "No logs yet." ]
    else
        div []
            [ logsActions logs
            , table [ class [ C.TxTable ] ]
                [ thead []
                    [ tr []
                        [ td [] [ text "Date" ]
                        , td [] [ text "Level" ]
                        , td [] [ text "Message" ]
                        ]
                    ]
                , tbody [] (List.map rowView logs.logs)
                ]
            ]


logs : Model -> Html Msg
logs model =
    case model.logs of
        NotAsked ->
            div [] []

        Loading ->
            div [] [ text "Loading logs..." ]

        Failure err ->
            div [] [ text (toString err) ]

        Success logs ->
            div []
                [ logsView logs
                ]


view : Model -> Html Msg
view model =
    div []
        [ h1 [] [ text "Latest Logs" ]
        , div [ class [ C.PaneWrapper ] ]
            [ div [ class [ C.LeftPane ] ]
                [ h2 [] [ text "Machines" ]
                , machines model
                ]
            , div [ class [ C.ContentPane ] ]
                [ h2 [] [ text "Logs" ]
                , latestLogSnapshot model
                , logs model
                ]
            ]
        ]
