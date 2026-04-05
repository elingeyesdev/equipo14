import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_alertas/app/app.dart';

void main() {
  testWidgets('App arranca y muestra navegación inferior', (WidgetTester tester) async {
    await tester.pumpWidget(const App());
    await tester.pump();

    expect(find.byType(BottomAppBar), findsOneWidget);
    expect(find.byIcon(Icons.map), findsOneWidget);
  });
}
