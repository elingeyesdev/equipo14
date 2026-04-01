import 'package:flutter/material.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const Text(
                "Historial",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: const [
                  Chip(label: Text("Todos")),
                  Chip(label: Text("Activo")),
                  Chip(label: Text("Resuelto")),
                ],
              ),

              const SizedBox(height: 20),

              Expanded(
                child: ListView(
                  children: [
                    buildItem("Robo", "Activo", Colors.red),
                    buildItem("Incendio", "Resuelto", Colors.green),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget buildItem(String title, String status, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          Icon(Icons.warning, color: color),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title),
              Text(status, style: const TextStyle(color: Colors.grey)),
            ],
          )
        ],
      ),
    );
  }
}