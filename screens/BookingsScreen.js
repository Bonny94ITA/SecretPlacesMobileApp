import React, {useEffect, useState} from 'react';
import base64 from 'react-native-base64';
import {
    AsyncStorage,
    Button,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View,
    Alert, ActivityIndicator
} from 'react-native';

import Header from '../components/Header';
import Colors from '../constants/colors';
import {AntDesign, Entypo} from '@expo/vector-icons';
import serverURL from '../components/ServerInfo';
import * as authActions from '../store/actions/auth';
import {useDispatch} from 'react-redux';
import * as SQLite from 'expo-sqlite';
import {PaymentsStripe as Stripe} from 'expo-payments-stripe';


const params = {
    // mandatory
    number: '4242424242424242',
    expMonth: 11,
    expYear: 17,
    cvc: '223',
    // optional
    name: 'Test User',
    currency: 'usd',
    addressLine1: '123 Test Street',
    addressLine2: 'Apt. 5',
    addressCity: 'Test City',
    addressState: 'Test State',
    addressCountry: 'Test Country',
    addressZip: '55555',
};

const Sojourn = (props) => {
    return props.sojourn;
}

const Item = ({item, bookings, setBookings, images}) => {
    const dispatch = useDispatch();

    const sojourns = item.sojourns.map((sojourn) =>
        <Sojourn key={sojourn.id.toString()}
                 sojourn={
                     <View style={styles.columnContainer}>
                         <View style={styles.rowContainer}>
                             <AntDesign name="home" size={20} style={styles.icon}/>
                             <Text style={[styles.text, {fontWeight: 'bold'}]}>{sojourn.hotelName}</Text>
                             <AntDesign name="enviromento" size={20} style={styles.icon}/>
                             <Text style={styles.text}>{sojourn.address}</Text>
                         </View>
                         <View style={styles.rowContainer}>
                             <View style={styles.columnContainer}>
                                 <View style={styles.rowContainer}>
                                     <AntDesign name="staro" size={20} style={styles.icon}/>
                                     <Text style={styles.text}>{sojourn.stars}</Text>
                                 </View>
                                 <View style={styles.rowContainer}>
                                     <AntDesign name="user" size={20} style={styles.icon}/>
                                     <Text style={styles.text}>{sojourn.numPlaces}</Text>
                                 </View>
                                 <View style={styles.rowContainer}>
                                     <Entypo name="credit" size={20} style={styles.icon}/>
                                     <Text style={styles.text}>{sojourn.pricePerNight}</Text>
                                 </View>
                             </View>
                             <View style={styles.columnContainer}>
                                 <Image
                                     style={styles.image}
                                     source={{
                                         uri: images[sojourn.idRoom]
                                     }}
                                 />
                             </View>
                         </View>
                         <View style={styles.rowContainer}>
                             <AntDesign name="calendar" size={20} style={styles.icon}/>
                             <Text style={styles.text}>{sojourn.arrival}</Text>
                             <AntDesign name="calendar" size={20} style={styles.icon}/>
                             <Text style={styles.text}>{sojourn.departure}</Text>
                         </View>
                         <View style={styles.orContainer}>
                             <View style={{flex: 1, height: 1, backgroundColor: 'orange'}}/>
                         </View>
                     </View>
                 }
        />
    );

    const deleteBooking_ = () =>
        Alert.alert(
            "Vuoi cancellare la ricerca?",
            "",
            [
                {
                    text: "Annulla",
                    style: "cancel"
                },
                {
                    text: "Conferma", onPress: () => {
                        async function httpRequest() {
                            const userData = await AsyncStorage.getItem('userData');
                            const jsonObj = JSON.parse(userData);
                            await deleteBooking(dispatch, jsonObj.token, jsonObj.tokenType, item.id);

                            return bookings.filter(function (booking) {
                                return booking.id !== item.id;
                            });
                        }

                        httpRequest().then(r => setBookings(r));
                    }
                }
            ],
            {cancelable: false}
        );

    const alert = () => {
        Alert.alert(
            "Pagato!",
            ""
        )
    };

    return (
        <View>
            <View style={styles.item}>
                {sojourns}
                <View>
                    <Button
                        title="Paga"
                        onPress={async () => {
                            console.log("ciao1")
                            const token = await Stripe.createTokenWithCardAsync(params);
                            console.log("ciao")
                            console.log(token)
                        }}
                        color={Colors.primary}
                    />
                </View>
                <View style={{marginVertical: 5}}>
                    <Button
                        title="Cancella"
                        onPress={deleteBooking_}
                        color={Colors.primary}
                    />
                </View>
            </View>
        </View>
    );
}

function timeout(milliseconds, promise) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error("Timeout exceeded."))
        }, milliseconds);
        promise.then(resolve, reject);
    });
}

async function getBookings(dispatch, token, tt, userId) {
    let bookings = null;

    await timeout(5000, fetch(serverURL + '/bookings/id/' + +userId, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            token_info: JSON.stringify({token: token, type: tt})
        }
    }))
        .then(async function (response) {
            bookings = await response.json();
            // console.log(bookings)
        }, function (error) {
            dispatch(authActions.submitLogout());
            console.log(error);
        }).catch(function (error) {
            dispatch(authActions.submitLogout());
            console.log(error);
        });

    return bookings;
}

async function deleteBooking(dispatch, token, tt, bookingId) {
    let res = null;

    await timeout(5000, fetch(serverURL + '/bookings/delete/' + +bookingId, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            token_info: JSON.stringify({token: token, type: tt})
        }
    }))
        .then(async function (response) {
            res = await response.json();
            // console.log(res);
        }, function (error) {
            dispatch(authActions.submitLogout());
            console.log(error);
        }).catch(function (error) {
            dispatch(authActions.submitLogout());
            console.log(error);
        });

    return res;
}

async function fetchBookings(dispatch) {
    const userData = await AsyncStorage.getItem('userData');
    const jsonObj = JSON.parse(userData);
    const bookings = await getBookings(dispatch, jsonObj.token, jsonObj.tokenType, jsonObj.userId);
    const formattedBookings = [];

    bookings.forEach(booking => {
        const formattedSojourns = [];
        booking.sojourns.forEach(element => {
            formattedSojourns.push({
                id: element.id,
                arrival: element.arrival,
                departure: element.departure,
                hotelName: element.room.hotel.name,
                address: element.room.hotel.address,
                hotelCity: element.room.hotel.city.name,
                stars: element.room.hotel.stars,
                idRoom: element.room.id,
                numPlaces: element.room.numPlaces,
                pricePerNight: element.room.pricePerNight,
                totalPrice: element.totalPrice
            })
        })

        formattedBookings.push({
            id: booking.id,
            sojourns: formattedSojourns,
            totalPrice: booking.totalPrice
        });
    });

    return formattedBookings;
}

async function fillDictionary() {
    return new Promise((resolve, reject) => {
        const db = SQLite.openDatabase("DB.db");
        const dict_ = {};
        db.transaction(tx => {
                const images = {};
                tx.executeSql(
                    'select * from mapping;',
                    [], function (tx, mapping) {
                        // console.log(mapping)
                        tx.executeSql(
                            'select * from images;',
                            [], function (tx, result) {
                                for (let i = 0; i < result.rows._array.length; ++i)
                                    images[result.rows._array[i]["id"]] = result.rows._array[i]["url"];

                                for (let i = 0; i < mapping.rows.length; ++i) {
                                    dict_[mapping.rows._array[i]["id_room"]] =
                                        base64.decode(images[mapping.rows._array[i]["id_img"]])
                                }
                            }
                        )
                    }
                )
            }, (err) => {
                console.log(err)
            },
            () => {
                console.log("Success")
                resolve(dict_);
            });
    });
}

const BookingsScreen = props => {
    console.log("render")
    const [bookings, setBookings] = useState([]);
    const [dict, setDict] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useDispatch();

    Stripe.setOptionsAsync({
        publishableKey: 'pk_test_51HptC0D6nxcG5uxcbjUWspldU65ohYJv3LeLc0blIjfQb2J6uObNlKEAGNqULn7Z0TreU8yYAGObgNrsS6G5Ma5G00OmJP7nPt', // Your key
        androidPayMode: 'test', // [optional] used to set wallet environment (AndroidPay)
        merchantId: 'your_merchant_id', // [optional] used for payments with ApplePay
    });

    useEffect(() => {
        const focusListener = props.navigation.addListener('didFocus', async () => {
            const fb = await fetchBookings(dispatch);
            const dict_ = await fillDictionary();
            setBookings(fb);
            setDict(dict_);
        });

        dispatch(authActions.setListener(focusListener));

        setIsLoading(true);
        fetchBookings(dispatch).then(bookings_ => {
            fillDictionary().then(dict_ => {
                setBookings(bookings_);
                setDict(dict_);
            });
        });
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (<View style={styles.loading}>
            <ActivityIndicator size={"large"} color={Colors.primary}/>
        </View>);
    }

    return (
        <View style={styles.header}>
            <Header title={"Ricerche Salvate "} navigation={props.navigation}/>
            <View style={styles.container}>
                <View style={styles.outputContainer}>
                    <FlatList
                        data={bookings}
                        renderItem={({item}) => {
                            if (item.sojourns.length > 0) {
                                return (
                                    <Item
                                        item={item}
                                        bookings={bookings}
                                        setBookings={setBookings}
                                        images={dict}
                                    />
                                );
                            }
                        }}
                        keyExtractor={item => item.id.toString()}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flex: 1
    },
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    outputContainer: {
        shadowColor: 'black',
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 6,
        shadowOpacity: 0.26,
        elevation: 8,
        padding: 20
    },
    item: {
        backgroundColor: Colors.containerBackground,
        padding: 10,
        margin: 10,
        borderRadius: 10
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 10
    },
    columnContainer: {
        flexDirection: 'column',
        paddingRight: 10
    },
    icon: {
        padding: 10,
        color: 'black'
    },
    text: {
        fontSize: 20
    },
    image: {
        width: 175,
        height: 150,
        borderRadius: 25
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default BookingsScreen;
