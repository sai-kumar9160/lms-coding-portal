import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.sql.*;

public class Demo {
    interface Notifier { void send(String message); }
    static class ConsoleNotifier implements Notifier {
        @Override public void send(String message) {
            System.out.println("Notice: " + message);
        }
    }

    public static void main(String[] args) throws Exception {
        Notifier notifier = new ConsoleNotifier();
        notifier.send("Class starts at 10");
    }
}
