import React from 'react';
import {View, Text, StyleSheet, Button} from 'react-native';
import Colors from "../constants/colors";
import Header from '../components/Header';
import {useSelector} from "react-redux";

const HomepageScreen = props => {
    const loginState = useSelector(state => state.auth);
    console.log("2");
    console.log(loginState);
    return (
        <View style={styles.header}>
            <Header title={"Homepage"}/>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flex: 1
    }
});

export default HomepageScreen;
