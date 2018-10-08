module MaintenanceFunding.View exposing (..)

import Html exposing (..)
import Html.Attributes exposing (href)
import RemoteData exposing (..)
import MaintenanceFunding.Types exposing (..)
import QRCode
import QRCode.ECLevel as ECLevel
import Css.Admin exposing (..)
import Css.Classes as C


qrCode : String -> Html msg
qrCode s =
    let
        resultQRCode =
            QRCode.toSvgWithECLevel s ECLevel.L
    in
        case resultQRCode of
            Result.Ok view ->
                view

            Result.Err err ->
                Html.text (toString err)


fundingView : SubModel -> Html Msg
fundingView subModel =
    div []
        [ cryptosView subModel.cryptoDisplays (Just subModel.cryptoCode)
        , section [ class [ C.Container ] ]
            [ div [] [ text ("Deposit " ++ subModel.cryptoCode ++ " to this address.") ]
            , div [] [ qrCode subModel.fundingAddressUrl ]
            , div [ class [ C.CryptoAddress ] ] [ text subModel.fundingAddress ]
            , section [ class [ C.BalanceSection ] ]
                [ h2 [] [ text "Balance" ]
                , div [] [ text (subModel.confirmedBalance ++ " " ++ subModel.cryptoCode ++ " (" ++ subModel.pending ++ " pending)") ]
                , div [] [ text (subModel.fiatConfirmedBalance ++ " " ++ subModel.fiatCode ++ " (" ++ subModel.fiatPending ++ " pending)") ]
                ]
            ]
        ]


cryptoView : Maybe String -> CryptoDisplay -> Html Msg
cryptoView maybeActiveCrypto cryptoDisplay =
    let
        activeClass =
            case maybeActiveCrypto of
                Nothing ->
                    class []

                Just activeCrypto ->
                    if (activeCrypto == cryptoDisplay.cryptoCode) then
                        class [ C.Active ]
                    else
                        class []

        url =
            "/#funding/" ++ cryptoDisplay.cryptoCode
    in
        a [ activeClass, class [ C.CryptoTab ], href url ] [ text cryptoDisplay.display ]


cryptosView : List CryptoDisplay -> Maybe String -> Html Msg
cryptosView cryptos activeCrypto =
    nav [ class [ C.CryptoTabs ] ] (List.map (cryptoView activeCrypto) cryptos)


view : Model -> Html Msg
view model =
    case model of
        NotAsked ->
            div [] []

        Loading ->
            div [] [ text "Loading..." ]

        Failure err ->
            div [] [ text (toString err) ]

        Success subModel ->
            fundingView subModel
