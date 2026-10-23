import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/emergency_takeover_dialog.dart';

class SafetyHubScreen extends StatefulWidget {
  const SafetyHubScreen({Key? key}) : super(key: key);

  @override
  State<SafetyHubScreen> createState() => _SafetyHubScreenState();
}

class _SafetyHubScreenState extends State<SafetyHubScreen> {
  bool _sentinelActive = true;

  void _simulateFakeCall() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF131B2E),
        title: const Row(
          children: [
            Icon(Icons.phone_in_talk, color: Colors.greenAccent),
            SizedBox(width: 10),
            Text('Fake Check-in Incoming', style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: const Text(
          'Simulated incoming voice call from "Home / Campus Security" scheduled in 10 seconds to help you exit an uncomfortable situation.',
          style: TextStyle(color: Colors.white70, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.secondary),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Start Ringing Now'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Safety Hub & Sentinel'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // 24/7 Sentinel Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, AppTheme.primaryContainer],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withOpacity(0.3),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.security, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '24/7 Security Sentinel',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Live route deviation & stillness monitoring',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _sentinelActive,
                    activeColor: Colors.white,
                    activeTrackColor: AppTheme.secondary,
                    onChanged: (val) => setState(() => _sentinelActive = val),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Safety Tools Header
            const Text(
              'Instant Defense & Escape Tools',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.onSurface,
              ),
            ),
            const SizedBox(height: 12),
            // Fake Check-in Call Tool
            _ToolTile(
              icon: Icons.phone_callback_rounded,
              title: 'Trigger Fake Check-in Call',
              subtitle: 'Simulates an incoming realistic call to gracefully walk away from strangers.',
              color: AppTheme.primaryContainer,
              onTap: _simulateFakeCall,
            ),
            const SizedBox(height: 12),
            // Emergency SOS Screen Takeover Trigger
            _ToolTile(
              icon: Icons.warning_amber_rounded,
              title: 'Test Emergency SOS Broadcast',
              subtitle: 'Simulate screen takeover and verified responder telemetry.',
              color: AppTheme.error,
              onTap: () {
                showDialog(
                  context: context,
                  builder: (_) => const EmergencyTakeoverDialog(),
                );
              },
            ),
            const SizedBox(height: 24),
            // Verified Emergency Contacts
            const Text(
              'Verified Responders (3 Notified on SOS)',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.onSurface,
              ),
            ),
            const SizedBox(height: 12),
            _ContactTile(name: 'Campus Security Control Room', phone: '+91 94444 00001'),
            const SizedBox(height: 8),
            _ContactTile(name: 'Emergency Host Family / Warden', phone: '+91 98765 11122'),
            const SizedBox(height: 8),
            _ContactTile(name: 'Local Police Dispatcher (112)', phone: '112'),
          ],
        ),
      ),
    );
  }
}

class _ToolTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _ToolTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E7FF)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.onSurfaceVariant.withOpacity(0.85),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final String name;
  final String phone;

  const _ContactTile({required this.name, required this.phone});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E7FF)),
      ),
      child: Row(
        children: [
          const Icon(Icons.verified_user, color: AppTheme.secondary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                Text(
                  phone,
                  style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
          const Icon(Icons.phone, color: AppTheme.primary, size: 18),
        ],
      ),
    );
  }
}
