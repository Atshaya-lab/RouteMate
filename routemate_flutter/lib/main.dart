import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/app_state.dart';
import 'theme/app_theme.dart';
import 'screens/home_map_screen.dart';
import 'screens/guide_dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set system UI overlay colors
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()..initialize()),
      ],
      child: const RouteMateApp(),
    ),
  );
}

class RouteMateApp extends StatelessWidget {
  const RouteMateApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return MaterialApp(
      title: 'RouteMate',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: _resolveInitialScreen(state),
    );
  }

  Widget _resolveInitialScreen(AppState state) {
    if (state.userRole == 'guide') {
      return const GuideDashboardScreen();
    } else {
      return const HomeMapScreen();
    }
  }
}
