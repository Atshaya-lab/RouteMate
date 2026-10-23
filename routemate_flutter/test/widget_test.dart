import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:routemate_flutter/main.dart';
import 'package:routemate_flutter/providers/app_state.dart';

void main() {
  testWidgets('RouteMateApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AppState()),
        ],
        child: const RouteMateApp(),
      ),
    );

    expect(find.byType(RouteMateApp), findsOneWidget);
  });
}
