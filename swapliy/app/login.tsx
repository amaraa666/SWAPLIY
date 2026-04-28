import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { login, user, error, clearError, loading } = useAuth();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            router.replace('/(tabs)/');
        }
    }, [router, user]);

    const handleLogin = async () => {
        if (!email || !password) {
            showToast('error', 'Please fill in all fields');
            return;
        }
        
        try {
            clearError();
            await login(email.trim(), password);
            showToast('success', 'Login successful!');
        } catch (err: any) {
            const message = err?.message || error || 'Failed to login. Please try again.';
            showToast('error', message);
        }};

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
                <View style={styles.headerContainer}>
                    <Image
                        style={{ width: 80, height: 80 }}
                        source={require('.././assets/images/logo.png')}
                    />
                    <Text style={styles.logoName}>Swapliy</Text>
                    <Text style={styles.subtitle}>Орчин үеийн солилцооны дижитал орчин</Text>
                </View>
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>И-мейл</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="hello@example.com"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            editable={true}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Нууц үг</Text>
                            <TouchableOpacity>
                                <Text style={styles.forgotLink}>Нууц үг мартсан?</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="••••••••"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye' : 'eye-off'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity 
                        style={{ width: '100%', marginTop: 30 }} 
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#1ECE90', '#FFD700']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.button, loading && { opacity: 0.6 }]}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Text style={styles.buttonText}>Log in</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Create Account Link */}
                    <TouchableOpacity style={styles.createAccountContainer} onPress={() => router.push('/signup')}>
                        <Text style={styles.createAccountText}>Create Account</Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Login */}
                    <View style={styles.socialContainer}>
                        <TouchableOpacity style={styles.socialButton}>
                            <AntDesign name="google" size={24} color="#1F2937" />
                            <Text style={styles.socialText}>Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton}>
                            <AntDesign name="apple" size={24} color="#1F2937" />
                            <Text style={styles.socialText}>Apple</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Text */}

                </View>
                <View>
                    <Text style={styles.footerText}>
                        By continuing, you agree to Swapliy&apos;s{' '}
                        <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
                        <Text style={styles.footerLink}>Privacy Policy</Text>.
                    </Text>
                </View>
            </View>
        </ScrollView>
);
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4F7',
        marginTop: 20,
    },
    content: {
        display: 'flex',
        justifyContent:"center",
        width: '100%',
        alignItems: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    logoName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    formContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    forgotLink: {
        fontSize: 12,
        color: '#6B7280',
    },
    input: {
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#1F2937',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 16,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 14,
        color: '#1F2937',
    },
    eyeButton: {
        padding: 8,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    createAccountContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    createAccountText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 12,
        color: '#6B7280',
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    socialText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        marginVertical: 10,
        lineHeight: 18,
    },
    footerLink: {
        color: '#1ECE90',
        fontWeight: '600',
    },

});
