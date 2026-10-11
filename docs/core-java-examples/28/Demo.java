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
    static class Ticket {
        static int created;
        Ticket() { created++; }
    }

    public static void main(String[] args) throws Exception {
        new Ticket();
        new Ticket();
        System.out.println(Ticket.created);
    }
}
