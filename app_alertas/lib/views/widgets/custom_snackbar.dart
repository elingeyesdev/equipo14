import 'package:flutter/material.dart';
import 'package:awesome_snackbar_content/awesome_snackbar_content.dart';

enum CustomSnackBarType { success, error, warning, info }

void showCustomSnackBar({
  required BuildContext context,
  required String title,
  required String message,
  required CustomSnackBarType type,
}) {
  ContentType contentType;
  switch (type) {
    case CustomSnackBarType.success:
      contentType = ContentType.success;
      break;
    case CustomSnackBarType.error:
      contentType = ContentType.failure;
      break;
    case CustomSnackBarType.warning:
      contentType = ContentType.warning;
      break;
    case CustomSnackBarType.info:
      contentType = ContentType.help;
      break;
  }

  final snackBar = SnackBar(
    elevation: 0,
    behavior: SnackBarBehavior.floating,
    backgroundColor: Colors.transparent,
    content: AwesomeSnackbarContent(
      title: title,
      message: message,
      contentType: contentType,
    ),
  );

  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(snackBar);
}
